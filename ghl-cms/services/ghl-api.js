/**
 * Go High Level API Service
 * Handles all API interactions with GHL CRM
 *
 * API Docs: https://marketplace.gohighlevel.com/docs/
 */

const { GHL_CONFIG } = require('../config/ghl-config');

class GHLApiService {
  constructor(accessToken) {
    this.accessToken = accessToken;
    this.baseUrl = GHL_CONFIG.apiBaseUrl;
    this.locationId = GHL_CONFIG.locationId;
    this.requestCount = 0;
    this.lastRequestTime = Date.now();
  }

  /**
   * Rate limiter to respect GHL API limits
   */
  async checkRateLimit() {
    const now = Date.now();
    const timeSinceLastBurst = now - this.lastRequestTime;

    if (timeSinceLastBurst < GHL_CONFIG.rateLimits.burstWindow) {
      if (this.requestCount >= GHL_CONFIG.rateLimits.burstLimit) {
        const waitTime = GHL_CONFIG.rateLimits.burstWindow - timeSinceLastBurst;
        await new Promise(resolve => setTimeout(resolve, waitTime));
        this.requestCount = 0;
        this.lastRequestTime = Date.now();
      }
    } else {
      this.requestCount = 0;
      this.lastRequestTime = now;
    }
    this.requestCount++;
  }

  /**
   * Make authenticated API request
   */
  async request(endpoint, options = {}) {
    await this.checkRateLimit();

    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
      'Version': '2021-07-28',
      ...options.headers
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      if (!response.ok) {
        const error = await response.json();
        throw new GHLApiError(response.status, error.message || 'API request failed', error);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof GHLApiError) throw error;
      throw new GHLApiError(500, error.message);
    }
  }

  // ==================== CONTACTS API ====================

  /**
   * Create a new contact in GHL
   * @param {Object} contactData - Contact information
   */
  async createContact(contactData) {
    const payload = {
      locationId: this.locationId,
      firstName: contactData.firstName,
      lastName: contactData.lastName,
      email: contactData.email,
      phone: contactData.phone,
      address1: contactData.address,
      city: contactData.city,
      state: contactData.state,
      postalCode: contactData.zip,
      source: contactData.source || 'KSOA Website',
      tags: contactData.tags || [],
      customFields: this.formatCustomFields(contactData.customFields)
    };

    return this.request('/contacts/', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  /**
   * Update an existing contact
   * @param {string} contactId - GHL Contact ID
   * @param {Object} contactData - Updated contact data
   */
  async updateContact(contactId, contactData) {
    const payload = {
      firstName: contactData.firstName,
      lastName: contactData.lastName,
      email: contactData.email,
      phone: contactData.phone,
      tags: contactData.tags,
      customFields: this.formatCustomFields(contactData.customFields)
    };

    return this.request(`/contacts/${contactId}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  }

  /**
   * Get contact by ID
   * @param {string} contactId - GHL Contact ID
   */
  async getContact(contactId) {
    return this.request(`/contacts/${contactId}`);
  }

  /**
   * Search contacts by email
   * @param {string} email - Email to search
   */
  async searchContactByEmail(email) {
    return this.request(`/contacts/search/duplicate?locationId=${this.locationId}&email=${encodeURIComponent(email)}`);
  }

  /**
   * Add tags to a contact
   * @param {string} contactId - GHL Contact ID
   * @param {Array} tags - Tags to add
   */
  async addContactTags(contactId, tags) {
    return this.request(`/contacts/${contactId}/tags`, {
      method: 'POST',
      body: JSON.stringify({ tags })
    });
  }

  // ==================== CUSTOM FIELDS API ====================

  /**
   * Get all custom fields for location
   */
  async getCustomFields() {
    return this.request(`/locations/${this.locationId}/customFields`);
  }

  /**
   * Create a custom field
   * @param {Object} fieldData - Custom field configuration
   */
  async createCustomField(fieldData) {
    return this.request(`/locations/${this.locationId}/customFields`, {
      method: 'POST',
      body: JSON.stringify(fieldData)
    });
  }

  /**
   * Format custom fields for API submission
   * @param {Object} fields - Key-value pairs of custom fields
   */
  formatCustomFields(fields) {
    if (!fields) return [];

    return Object.entries(fields).map(([key, value]) => ({
      id: GHL_CONFIG.customFields[key] || key,
      value: Array.isArray(value) ? value.join(', ') : value
    }));
  }

  // ==================== OPPORTUNITIES API ====================

  /**
   * Create an opportunity (pipeline deal)
   * @param {Object} opportunityData - Opportunity information
   */
  async createOpportunity(opportunityData) {
    const payload = {
      locationId: this.locationId,
      pipelineId: opportunityData.pipelineId,
      pipelineStageId: opportunityData.stageId,
      contactId: opportunityData.contactId,
      name: opportunityData.name,
      monetaryValue: opportunityData.value,
      source: opportunityData.source || 'KSOA Website'
    };

    return this.request('/opportunities/', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  /**
   * Update opportunity status
   * @param {string} opportunityId - Opportunity ID
   * @param {Object} updateData - Updated data
   */
  async updateOpportunity(opportunityId, updateData) {
    return this.request(`/opportunities/${opportunityId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  }

  // ==================== CALENDARS API ====================

  /**
   * Get available calendars
   */
  async getCalendars() {
    return this.request(`/calendars?locationId=${this.locationId}`);
  }

  /**
   * Get available time slots
   * @param {string} calendarId - Calendar ID
   * @param {string} startDate - Start date (ISO format)
   * @param {string} endDate - End date (ISO format)
   */
  async getAvailableSlots(calendarId, startDate, endDate) {
    return this.request(
      `/calendars/${calendarId}/free-slots?startDate=${startDate}&endDate=${endDate}`
    );
  }

  /**
   * Book an appointment
   * @param {Object} appointmentData - Appointment details
   */
  async bookAppointment(appointmentData) {
    return this.request('/calendars/events/appointments', {
      method: 'POST',
      body: JSON.stringify({
        calendarId: appointmentData.calendarId,
        locationId: this.locationId,
        contactId: appointmentData.contactId,
        startTime: appointmentData.startTime,
        endTime: appointmentData.endTime,
        title: appointmentData.title,
        appointmentStatus: 'confirmed'
      })
    });
  }

  // ==================== FORMS API ====================

  /**
   * Get all forms for location
   */
  async getForms() {
    return this.request(`/forms?locationId=${this.locationId}`);
  }

  /**
   * Get form submissions
   * @param {string} formId - Form ID
   */
  async getFormSubmissions(formId) {
    return this.request(`/forms/submissions?locationId=${this.locationId}&formId=${formId}`);
  }

  // ==================== WEBHOOKS API ====================

  /**
   * Create a webhook
   * @param {Object} webhookData - Webhook configuration
   */
  async createWebhook(webhookData) {
    return this.request('/webhooks/', {
      method: 'POST',
      body: JSON.stringify({
        locationId: this.locationId,
        url: webhookData.url,
        events: webhookData.events
      })
    });
  }

  /**
   * Get all webhooks
   */
  async getWebhooks() {
    return this.request(`/webhooks?locationId=${this.locationId}`);
  }
}

/**
 * Custom error class for GHL API errors
 */
class GHLApiError extends Error {
  constructor(statusCode, message, details = {}) {
    super(message);
    this.name = 'GHLApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

module.exports = { GHLApiService, GHLApiError };
