/**
 * GHL Webhook Handler
 * Receives webhooks from Go High Level CRM
 */

const crypto = require('crypto');
const { WEBHOOK_EVENTS } = require('../config/ghl-config');

// Webhook secret for signature verification
const WEBHOOK_SECRET = process.env.GHL_WEBHOOK_SECRET;

/**
 * Verify webhook signature
 * @param {string} payload - Raw request body
 * @param {string} signature - Signature from headers
 */
function verifySignature(payload, signature) {
  if (!WEBHOOK_SECRET) {
    console.warn('GHL_WEBHOOK_SECRET not configured - skipping verification');
    return true;
  }

  const expectedSignature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Handle GHL webhook events
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
async function handleWebhook(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-GHL-Signature');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get raw body for signature verification
    const rawBody = JSON.stringify(req.body);
    const signature = req.headers['x-ghl-signature'];

    // Verify webhook signature
    if (signature && !verifySignature(rawBody, signature)) {
      console.error('Webhook signature verification failed');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = req.body;
    const eventType = event.type || event.event;

    console.log(`Received GHL webhook: ${eventType}`, event);

    // Process different event types
    switch (eventType) {
      case WEBHOOK_EVENTS.FORM_SUBMITTED:
        await handleFormSubmitted(event);
        break;

      case WEBHOOK_EVENTS.CONTACT_CREATED:
        await handleContactCreated(event);
        break;

      case WEBHOOK_EVENTS.CONTACT_UPDATED:
        await handleContactUpdated(event);
        break;

      case WEBHOOK_EVENTS.APPOINTMENT_BOOKED:
        await handleAppointmentBooked(event);
        break;

      case WEBHOOK_EVENTS.OPPORTUNITY_CREATED:
        await handleOpportunityCreated(event);
        break;

      case WEBHOOK_EVENTS.OPPORTUNITY_UPDATED:
        await handleOpportunityUpdated(event);
        break;

      default:
        console.log(`Unhandled webhook event type: ${eventType}`);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}

/**
 * Handle form submission from GHL
 */
async function handleFormSubmitted(event) {
  const { formId, formName, contact, submissions } = event;

  console.log(`Form submitted: ${formName} (${formId})`);
  console.log('Contact:', contact);
  console.log('Submissions:', submissions);

  // Custom logic for KSOA forms
  if (formName?.includes('Membership') || formName?.includes('membership')) {
    // Trigger membership workflow
    console.log('Processing membership application...');
    // Send notification to KSOA admin
    // Update member records
    // Trigger welcome email sequence
  }

  if (formName?.includes('Training') || formName?.includes('training')) {
    // Trigger training registration workflow
    console.log('Processing training registration...');
    // Add to training calendar
    // Send confirmation email
  }
}

/**
 * Handle new contact creation
 */
async function handleContactCreated(event) {
  const { contact } = event;

  console.log(`New contact created: ${contact.firstName} ${contact.lastName}`);
  console.log('Email:', contact.email);
  console.log('Tags:', contact.tags);

  // Check if this is a sports official lead
  const sportsTags = ['Football', 'Soccer', 'Softball', 'Baseball', 'Wrestling', 'Basketball', 'Volleyball'];
  const hasSportsTag = contact.tags?.some(tag => sportsTags.includes(tag));

  if (hasSportsTag) {
    console.log('New sports official lead detected');
    // Trigger sport-specific nurturing workflow
  }
}

/**
 * Handle contact update
 */
async function handleContactUpdated(event) {
  const { contact, changes } = event;

  console.log(`Contact updated: ${contact.id}`);
  console.log('Changes:', changes);

  // Track membership status changes
  if (changes?.tags) {
    const newTags = changes.tags;
    if (newTags.includes('Active Member')) {
      console.log('Contact upgraded to Active Member');
      // Update member directory
      // Grant access to member resources
    }
  }
}

/**
 * Handle appointment booking
 */
async function handleAppointmentBooked(event) {
  const { appointment, contact, calendar } = event;

  console.log(`Appointment booked: ${appointment.title}`);
  console.log('Date:', appointment.startTime);
  console.log('Contact:', contact?.email);
  console.log('Calendar:', calendar?.name);

  // Handle training session bookings
  if (calendar?.name?.includes('Training')) {
    console.log('Training session booked');
    // Add to training roster
    // Send pre-training materials
  }

  // Handle evaluation appointments
  if (calendar?.name?.includes('Evaluation')) {
    console.log('Evaluation session booked');
    // Notify evaluators
    // Prepare evaluation forms
  }
}

/**
 * Handle opportunity creation
 */
async function handleOpportunityCreated(event) {
  const { opportunity, contact, pipeline, stage } = event;

  console.log(`Opportunity created: ${opportunity.name}`);
  console.log('Pipeline:', pipeline?.name);
  console.log('Stage:', stage?.name);
  console.log('Value:', opportunity.monetaryValue);

  // Track membership pipeline
  if (pipeline?.name === 'Membership Pipeline') {
    console.log('New membership opportunity');
    // Assign to recruitment committee
  }

  // Track training pipeline
  if (pipeline?.name === 'Training Pipeline') {
    console.log('New training opportunity');
    // Assign to sport committee
  }
}

/**
 * Handle opportunity update
 */
async function handleOpportunityUpdated(event) {
  const { opportunity, previousStage, newStage } = event;

  console.log(`Opportunity updated: ${opportunity.name}`);
  console.log('Previous stage:', previousStage?.name);
  console.log('New stage:', newStage?.name);

  // Track stage transitions
  if (newStage?.name === 'Won' || newStage?.name === 'Member Approved') {
    console.log('New member approved!');
    // Create member account
    // Send welcome package
    // Add to member directory
  }

  if (newStage?.name === 'Lost' || newStage?.name === 'Declined') {
    console.log('Application declined');
    // Send feedback survey
    // Remove from active pipeline
  }
}

module.exports = handleWebhook;
