/**
 * Go High Level CRM Configuration
 * KSOA Sports Form Builder
 *
 * API Documentation: https://marketplace.gohighlevel.com/docs/
 */

const GHL_CONFIG = {
  // API Base URL (Lead Connector)
  apiBaseUrl: process.env.GHL_API_BASE_URL || 'https://services.leadconnectorhq.com',

  // API Version
  apiVersion: 'v2',

  // OAuth Configuration
  oauth: {
    clientId: process.env.GHL_CLIENT_ID,
    clientSecret: process.env.GHL_CLIENT_SECRET,
    redirectUri: process.env.GHL_REDIRECT_URI || 'https://ksoasports.com/api/ghl/callback',
    scopes: [
      'contacts.readonly',
      'contacts.write',
      'forms.readonly',
      'forms.write',
      'locations.readonly',
      'locations/customFields.readonly',
      'locations/customFields.write',
      'opportunities.readonly',
      'opportunities.write',
      'calendars.readonly',
      'calendars/events.write'
    ]
  },

  // Location (Sub-Account) ID
  locationId: process.env.GHL_LOCATION_ID,

  // API Rate Limits
  rateLimits: {
    burstLimit: 100,        // 100 requests per 10 seconds
    burstWindow: 10000,     // 10 seconds in ms
    dailyLimit: 200000      // 200,000 requests per day
  },

  // KSOA Sports Configuration
  sports: [
    { id: 'football', name: 'Football', slug: 'football', icon: '🏈' },
    { id: 'soccer', name: 'Soccer', slug: 'soccer', icon: '⚽' },
    { id: 'softball', name: 'Softball', slug: 'softball', icon: '🥎' },
    { id: 'baseball', name: 'Baseball', slug: 'baseball', icon: '⚾' },
    { id: 'wrestling', name: 'Wrestling', slug: 'wrestling', icon: '🤼' },
    { id: 'basketball', name: 'Basketball', slug: 'basketball', icon: '🏀' },
    { id: 'volleyball', name: 'Volleyball', slug: 'volleyball', icon: '🏐' }
  ],

  // Membership Pricing
  membership: {
    oneSport: 35,
    twoSports: 45,
    threeOrMore: 55,
    transactionFee: 2
  },

  // Custom Field Mappings for KSOA
  customFields: {
    sports_interested: 'sports_interested',
    officiating_experience: 'officiating_experience',
    years_experience: 'years_experience',
    kshsaa_registered: 'kshsaa_registered',
    certification_level: 'certification_level',
    availability: 'availability',
    referee_number: 'referee_number',
    emergency_contact: 'emergency_contact',
    emergency_phone: 'emergency_phone'
  },

  // Pipeline Configuration
  pipelines: {
    membership: 'membership_pipeline',
    training: 'training_pipeline',
    events: 'events_pipeline'
  },

  // Tags for Contacts
  tags: {
    newMember: 'New Member',
    interested: 'Interested',
    trainee: 'In Training',
    activeMember: 'Active Member',
    veteran: 'Veteran Official'
  }
};

// Webhook Events
const WEBHOOK_EVENTS = {
  FORM_SUBMITTED: 'form_submitted',
  CONTACT_CREATED: 'contact_created',
  CONTACT_UPDATED: 'contact_updated',
  APPOINTMENT_BOOKED: 'appointment_booked',
  OPPORTUNITY_CREATED: 'opportunity_created',
  OPPORTUNITY_UPDATED: 'opportunity_updated'
};

// Form Types
const FORM_TYPES = {
  MEMBERSHIP_APPLICATION: 'membership_application',
  INTEREST_FORM: 'interest_form',
  TRAINING_REGISTRATION: 'training_registration',
  EVENT_REGISTRATION: 'event_registration',
  CONTACT_FORM: 'contact_form',
  FEEDBACK_FORM: 'feedback_form'
};

module.exports = {
  GHL_CONFIG,
  WEBHOOK_EVENTS,
  FORM_TYPES
};
