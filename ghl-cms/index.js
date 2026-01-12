/**
 * KSOA Sports - GHL CMS Form Builder
 * Main entry point for the Go High Level CRM integration
 *
 * This module provides a complete form builder and CMS solution
 * for ksoasports.com integrated with Go High Level CRM.
 */

const { GHL_CONFIG, WEBHOOK_EVENTS, FORM_TYPES } = require('./config/ghl-config');
const { GHLApiService, GHLApiError } = require('./services/ghl-api');
const { GHLOAuthService, oauthService } = require('./services/oauth');
const { FormBuilderService, formBuilderService } = require('./services/form-builder');
const {
  FORM_TEMPLATES,
  SPORT_SPECIFIC_FORMS,
  getFormTemplate,
  getAllFormTemplates,
  getFormsByType
} = require('./templates/form-templates');

// API Handlers
const handleSubmission = require('./api/submit');
const handleWebhook = require('./api/webhook');
const { handleOAuthCallback, initiateOAuth, disconnectGHL } = require('./api/oauth-callback');

/**
 * Initialize the GHL CMS
 * @param {Object} config - Configuration options
 */
function initialize(config = {}) {
  // Override config if provided
  if (config.locationId) {
    process.env.GHL_LOCATION_ID = config.locationId;
  }
  if (config.apiKey) {
    process.env.GHL_API_KEY = config.apiKey;
  }

  console.log('KSOA GHL CMS initialized');
  console.log('Sports configured:', GHL_CONFIG.sports.map(s => s.name).join(', '));
  console.log('Form templates available:', Object.keys(getAllFormTemplates()).length);

  return {
    config: GHL_CONFIG,
    api: GHLApiService,
    oauth: oauthService,
    formBuilder: formBuilderService,
    templates: getAllFormTemplates()
  };
}

/**
 * Express/Connect middleware for handling GHL routes
 */
function createRouter() {
  return {
    // Form submission
    'POST /api/ghl/submit': handleSubmission,

    // Webhook handler
    'POST /api/ghl/webhook': handleWebhook,

    // OAuth routes
    'GET /api/ghl/oauth/authorize': initiateOAuth,
    'GET /api/ghl/oauth/callback': handleOAuthCallback,
    'POST /api/ghl/oauth/disconnect': disconnectGHL,

    // Form template API
    'GET /api/ghl/forms': async (req, res) => {
      res.json({
        success: true,
        forms: getAllFormTemplates()
      });
    },

    // Get specific form
    'GET /api/ghl/forms/:id': async (req, res) => {
      const form = getFormTemplate(req.params.id);
      if (form) {
        res.json({ success: true, form });
      } else {
        res.status(404).json({ success: false, message: 'Form not found' });
      }
    },

    // Generate form HTML
    'GET /api/ghl/forms/:id/html': async (req, res) => {
      const form = getFormTemplate(req.params.id);
      if (form) {
        const html = formBuilderService.generateFormHTML(form, {
          includeStyles: req.query.styles !== 'false'
        });
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
      } else {
        res.status(404).json({ success: false, message: 'Form not found' });
      }
    },

    // Get submissions
    'GET /api/ghl/submissions': async (req, res) => {
      const { formId } = req.query;
      const submissions = formId
        ? formBuilderService.getSubmissions(formId)
        : formBuilderService.getAllSubmissions();
      res.json({ success: true, submissions });
    }
  };
}

/**
 * Vercel serverless handler
 */
function createVercelHandler(route) {
  return async (req, res) => {
    const routes = createRouter();
    const handler = routes[`${req.method} ${route}`];

    if (handler) {
      return handler(req, res);
    }

    res.status(404).json({ error: 'Not found' });
  };
}

module.exports = {
  // Configuration
  GHL_CONFIG,
  WEBHOOK_EVENTS,
  FORM_TYPES,

  // Services
  GHLApiService,
  GHLApiError,
  GHLOAuthService,
  oauthService,
  FormBuilderService,
  formBuilderService,

  // Templates
  FORM_TEMPLATES,
  SPORT_SPECIFIC_FORMS,
  getFormTemplate,
  getAllFormTemplates,
  getFormsByType,

  // API Handlers
  handleSubmission,
  handleWebhook,
  handleOAuthCallback,
  initiateOAuth,
  disconnectGHL,

  // Initialization
  initialize,
  createRouter,
  createVercelHandler
};
