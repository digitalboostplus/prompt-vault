/**
 * Form Submission API Handler
 * Processes form submissions and syncs to GHL CRM
 */

const { formBuilderService } = require('../services/form-builder');

/**
 * Handle form submission
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
async function handleSubmission(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  try {
    const { formId, ...formData } = req.body;

    if (!formId) {
      return res.status(400).json({
        success: false,
        message: 'Form ID is required'
      });
    }

    // Process the submission
    const result = await formBuilderService.processSubmission(formId, formData);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: result.message,
        submissionId: result.submission.id
      });
    } else {
      return res.status(400).json({
        success: false,
        errors: result.errors,
        message: 'Validation failed'
      });
    }
  } catch (error) {
    console.error('Form submission error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred processing your submission'
    });
  }
}

module.exports = handleSubmission;
