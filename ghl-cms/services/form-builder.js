/**
 * Form Builder Service
 * Generates and manages forms for KSOA Sports website
 */

const { getFormTemplate, getAllFormTemplates } = require('../templates/form-templates');
const { GHLApiService } = require('./ghl-api');
const { oauthService } = require('./oauth');

class FormBuilderService {
  constructor() {
    this.forms = new Map();
    this.submissions = new Map();
  }

  /**
   * Get GHL API instance with valid token
   */
  async getGHLApi() {
    const accessToken = await oauthService.getValidAccessToken();
    return new GHLApiService(accessToken);
  }

  /**
   * Create a new form from template
   * @param {string} templateId - Template ID to use
   * @param {Object} customizations - Optional customizations
   */
  createForm(templateId, customizations = {}) {
    const template = getFormTemplate(templateId);

    if (!template) {
      throw new Error(`Form template not found: ${templateId}`);
    }

    const form = {
      ...template,
      ...customizations,
      id: customizations.id || `${templateId}_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.forms.set(form.id, form);
    return form;
  }

  /**
   * Get form by ID
   * @param {string} formId - Form ID
   */
  getForm(formId) {
    return this.forms.get(formId);
  }

  /**
   * Update form configuration
   * @param {string} formId - Form ID
   * @param {Object} updates - Updates to apply
   */
  updateForm(formId, updates) {
    const form = this.forms.get(formId);

    if (!form) {
      throw new Error(`Form not found: ${formId}`);
    }

    const updatedForm = {
      ...form,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.forms.set(formId, updatedForm);
    return updatedForm;
  }

  /**
   * Delete a form
   * @param {string} formId - Form ID
   */
  deleteForm(formId) {
    return this.forms.delete(formId);
  }

  /**
   * Validate form submission data
   * @param {Object} form - Form configuration
   * @param {Object} data - Submitted data
   */
  validateSubmission(form, data) {
    const errors = [];

    form.sections.forEach(section => {
      section.fields.forEach(field => {
        const value = data[field.id];

        // Required validation
        if (field.required && !value) {
          errors.push({
            field: field.id,
            message: `${field.label} is required`
          });
          return;
        }

        if (!value) return;

        // Type-specific validation
        if (field.validation) {
          // Min length
          if (field.validation.minLength && value.length < field.validation.minLength) {
            errors.push({
              field: field.id,
              message: `${field.label} must be at least ${field.validation.minLength} characters`
            });
          }

          // Max length
          if (field.validation.maxLength && value.length > field.validation.maxLength) {
            errors.push({
              field: field.id,
              message: `${field.label} must be no more than ${field.validation.maxLength} characters`
            });
          }

          // Min value
          if (field.validation.min !== undefined && Number(value) < field.validation.min) {
            errors.push({
              field: field.id,
              message: `${field.label} must be at least ${field.validation.min}`
            });
          }

          // Max value
          if (field.validation.max !== undefined && Number(value) > field.validation.max) {
            errors.push({
              field: field.id,
              message: `${field.label} must be no more than ${field.validation.max}`
            });
          }

          // Pattern validation
          if (field.validation.pattern) {
            const patterns = {
              email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              phone: /^[\d\s\-\(\)\.+]+$/,
              zipcode: /^\d{5}(-\d{4})?$/
            };

            const pattern = patterns[field.validation.pattern];
            if (pattern && !pattern.test(value)) {
              errors.push({
                field: field.id,
                message: `${field.label} format is invalid`
              });
            }
          }
        }
      });
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Process form submission
   * @param {string} formId - Form ID
   * @param {Object} data - Submitted data
   */
  async processSubmission(formId, data) {
    const form = this.forms.get(formId) || getFormTemplate(formId);

    if (!form) {
      throw new Error(`Form not found: ${formId}`);
    }

    // Validate submission
    const validation = this.validateSubmission(form, data);
    if (!validation.isValid) {
      return {
        success: false,
        errors: validation.errors
      };
    }

    // Create submission record
    const submission = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      formId: form.id,
      formName: form.name,
      data,
      submittedAt: new Date().toISOString(),
      status: 'pending'
    };

    // Store submission
    if (!this.submissions.has(formId)) {
      this.submissions.set(formId, []);
    }
    this.submissions.get(formId).push(submission);

    // Sync to GHL CRM
    try {
      const ghlResult = await this.syncToGHL(form, data, submission);
      submission.ghlContactId = ghlResult.contactId;
      submission.ghlOpportunityId = ghlResult.opportunityId;
      submission.status = 'synced';
    } catch (error) {
      console.error('GHL sync failed:', error);
      submission.status = 'sync_failed';
      submission.syncError = error.message;
    }

    return {
      success: true,
      submission,
      message: form.successMessage
    };
  }

  /**
   * Sync submission to Go High Level CRM
   * @param {Object} form - Form configuration
   * @param {Object} data - Submitted data
   * @param {Object} submission - Submission record
   */
  async syncToGHL(form, data, submission) {
    const ghlApi = await this.getGHLApi();

    // Extract contact data
    const contactData = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      address: data.address,
      city: data.city,
      state: data.state,
      zip: data.zip,
      source: `KSOA Website - ${form.name}`,
      tags: form.ghlMapping?.tags || [],
      customFields: {
        sports_interested: data.sports_interested,
        experience_level: data.experience_level,
        years_experience: data.years_experience,
        kshsaa_registered: data.kshsaa_registered,
        certification_level: data.certification_level,
        availability: data.availability,
        referee_number: data.referee_number,
        emergency_contact: data.emergency_contact,
        emergency_phone: data.emergency_phone
      }
    };

    // Check if contact already exists
    let contact;
    try {
      const existingContact = await ghlApi.searchContactByEmail(data.email);
      if (existingContact?.contacts?.length > 0) {
        // Update existing contact
        contact = await ghlApi.updateContact(
          existingContact.contacts[0].id,
          contactData
        );
      } else {
        // Create new contact
        contact = await ghlApi.createContact(contactData);
      }
    } catch (error) {
      console.error('Contact sync error:', error);
      throw error;
    }

    const result = {
      contactId: contact.contact?.id || contact.id
    };

    // Create opportunity if pipeline is specified
    if (form.ghlMapping?.pipeline) {
      try {
        const opportunity = await ghlApi.createOpportunity({
          pipelineId: form.ghlMapping.pipeline,
          stageId: form.ghlMapping.stage,
          contactId: result.contactId,
          name: `${data.firstName} ${data.lastName} - ${form.name}`,
          source: 'KSOA Website'
        });
        result.opportunityId = opportunity.opportunity?.id || opportunity.id;
      } catch (error) {
        console.error('Opportunity creation error:', error);
        // Don't throw - contact was still created
      }
    }

    return result;
  }

  /**
   * Get submissions for a form
   * @param {string} formId - Form ID
   */
  getSubmissions(formId) {
    return this.submissions.get(formId) || [];
  }

  /**
   * Get all submissions
   */
  getAllSubmissions() {
    const all = [];
    this.submissions.forEach((subs, formId) => {
      all.push(...subs);
    });
    return all.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  }

  /**
   * Generate HTML for a form
   * @param {Object} form - Form configuration
   * @param {Object} options - Rendering options
   */
  generateFormHTML(form, options = {}) {
    const {
      action = '/api/ghl/submit',
      method = 'POST',
      cssClass = 'ksoa-form',
      includeStyles = true
    } = options;

    let html = '';

    if (includeStyles) {
      html += this.generateFormStyles();
    }

    html += `
<form id="${form.id}" class="${cssClass}" action="${action}" method="${method}" data-form-id="${form.id}">
  <input type="hidden" name="formId" value="${form.id}">

  ${form.sections.map(section => `
  <fieldset class="${cssClass}__section" id="${section.id}">
    <legend class="${cssClass}__section-title">${section.title}</legend>
    ${section.description ? `<p class="${cssClass}__section-desc">${section.description}</p>` : ''}

    <div class="${cssClass}__fields">
      ${section.fields.map(field => this.generateFieldHTML(field, cssClass)).join('\n')}
    </div>
  </fieldset>
  `).join('\n')}

  <div class="${cssClass}__actions">
    <button type="submit" class="${cssClass}__submit">${form.submitButtonText}</button>
  </div>

  <div class="${cssClass}__message" style="display: none;"></div>
</form>

<script>
${this.generateFormScript(form)}
</script>
`;

    return html;
  }

  /**
   * Generate HTML for a single field
   * @param {Object} field - Field configuration
   * @param {string} cssClass - Base CSS class
   */
  generateFieldHTML(field, cssClass) {
    if (field.type === 'hidden') {
      return `<input type="hidden" name="${field.id}" value="${field.defaultValue || ''}">`;
    }

    let input = '';

    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
      case 'number':
        input = `
          <input
            type="${field.type}"
            id="${field.id}"
            name="${field.id}"
            placeholder="${field.placeholder || ''}"
            ${field.required ? 'required' : ''}
            ${field.validation?.minLength ? `minlength="${field.validation.minLength}"` : ''}
            ${field.validation?.maxLength ? `maxlength="${field.validation.maxLength}"` : ''}
            ${field.validation?.min !== undefined ? `min="${field.validation.min}"` : ''}
            ${field.validation?.max !== undefined ? `max="${field.validation.max}"` : ''}
            class="${cssClass}__input"
          >
        `;
        break;

      case 'textarea':
        input = `
          <textarea
            id="${field.id}"
            name="${field.id}"
            placeholder="${field.placeholder || ''}"
            ${field.required ? 'required' : ''}
            ${field.validation?.maxLength ? `maxlength="${field.validation.maxLength}"` : ''}
            class="${cssClass}__textarea"
            rows="4"
          ></textarea>
        `;
        break;

      case 'select':
        input = `
          <select
            id="${field.id}"
            name="${field.id}"
            ${field.required ? 'required' : ''}
            class="${cssClass}__select"
          >
            <option value="">${field.placeholder || 'Select an option...'}</option>
            ${(field.options || []).map(opt => `
              <option value="${opt.value}">${opt.label}</option>
            `).join('')}
          </select>
        `;
        break;

      case 'radio':
        input = `
          <div class="${cssClass}__radio-group">
            ${(field.options || []).map((opt, idx) => `
              <label class="${cssClass}__radio-label">
                <input
                  type="radio"
                  name="${field.id}"
                  value="${opt.value}"
                  ${field.required && idx === 0 ? 'required' : ''}
                  class="${cssClass}__radio"
                >
                <span>${opt.label}</span>
              </label>
            `).join('')}
          </div>
        `;
        break;

      case 'checkbox-group':
        input = `
          <div class="${cssClass}__checkbox-group">
            ${(field.options || []).map(opt => `
              <label class="${cssClass}__checkbox-label">
                <input
                  type="checkbox"
                  name="${field.id}"
                  value="${opt.value}"
                  class="${cssClass}__checkbox"
                >
                <span>${opt.label}</span>
              </label>
            `).join('')}
          </div>
        `;
        break;

      default:
        input = `<input type="text" id="${field.id}" name="${field.id}" class="${cssClass}__input">`;
    }

    return `
      <div class="${cssClass}__field ${field.required ? `${cssClass}__field--required` : ''}" data-field="${field.id}">
        <label for="${field.id}" class="${cssClass}__label">
          ${field.label}
          ${field.required ? '<span class="required">*</span>' : ''}
        </label>
        ${field.helpText ? `<p class="${cssClass}__help">${field.helpText}</p>` : ''}
        ${input}
        <span class="${cssClass}__error" data-error="${field.id}"></span>
      </div>
    `;
  }

  /**
   * Generate CSS styles for forms
   */
  generateFormStyles() {
    return `
<style>
.ksoa-form {
  max-width: 700px;
  margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
}

.ksoa-form__section {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 24px;
  background: #fff;
}

.ksoa-form__section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a1a2e;
  padding: 0 8px;
}

.ksoa-form__section-desc {
  color: #666;
  font-size: 0.875rem;
  margin: 8px 0 16px;
}

.ksoa-form__fields {
  display: grid;
  gap: 16px;
}

.ksoa-form__field {
  display: flex;
  flex-direction: column;
}

.ksoa-form__label {
  font-weight: 500;
  margin-bottom: 6px;
  color: #333;
}

.ksoa-form__label .required {
  color: #e53e3e;
  margin-left: 2px;
}

.ksoa-form__help {
  font-size: 0.75rem;
  color: #666;
  margin: 0 0 6px;
}

.ksoa-form__input,
.ksoa-form__textarea,
.ksoa-form__select {
  padding: 10px 12px;
  border: 1px solid #d0d0d0;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.ksoa-form__input:focus,
.ksoa-form__textarea:focus,
.ksoa-form__select:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.ksoa-form__radio-group,
.ksoa-form__checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ksoa-form__radio-label,
.ksoa-form__checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.ksoa-form__error {
  font-size: 0.75rem;
  color: #e53e3e;
  margin-top: 4px;
  display: none;
}

.ksoa-form__field--error .ksoa-form__error {
  display: block;
}

.ksoa-form__field--error .ksoa-form__input,
.ksoa-form__field--error .ksoa-form__textarea,
.ksoa-form__field--error .ksoa-form__select {
  border-color: #e53e3e;
}

.ksoa-form__actions {
  text-align: center;
  margin-top: 24px;
}

.ksoa-form__submit {
  background: #2563eb;
  color: #fff;
  border: none;
  padding: 14px 32px;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.ksoa-form__submit:hover {
  background: #1d4ed8;
}

.ksoa-form__submit:disabled {
  background: #93c5fd;
  cursor: not-allowed;
}

.ksoa-form__message {
  text-align: center;
  padding: 16px;
  border-radius: 8px;
  margin-top: 16px;
}

.ksoa-form__message--success {
  background: #d1fae5;
  color: #065f46;
}

.ksoa-form__message--error {
  background: #fee2e2;
  color: #991b1b;
}

@media (min-width: 640px) {
  .ksoa-form__fields {
    grid-template-columns: repeat(2, 1fr);
  }

  .ksoa-form__field--full {
    grid-column: span 2;
  }
}
</style>
`;
  }

  /**
   * Generate JavaScript for form handling
   * @param {Object} form - Form configuration
   */
  generateFormScript(form) {
    return `
(function() {
  const form = document.getElementById('${form.id}');
  const messageEl = form.querySelector('.ksoa-form__message');
  const submitBtn = form.querySelector('.ksoa-form__submit');

  form.addEventListener('submit', async function(e) {
    e.preventDefault();

    // Clear previous errors
    form.querySelectorAll('.ksoa-form__field--error').forEach(el => {
      el.classList.remove('ksoa-form__field--error');
    });
    form.querySelectorAll('.ksoa-form__error').forEach(el => {
      el.textContent = '';
    });

    // Collect form data
    const formData = new FormData(form);
    const data = {};

    // Handle checkbox groups
    const checkboxGroups = {};
    form.querySelectorAll('.ksoa-form__checkbox-group').forEach(group => {
      const name = group.querySelector('input').name;
      checkboxGroups[name] = [];
      group.querySelectorAll('input:checked').forEach(cb => {
        checkboxGroups[name].push(cb.value);
      });
    });

    formData.forEach((value, key) => {
      if (checkboxGroups[key]) {
        data[key] = checkboxGroups[key];
      } else if (data[key]) {
        // Handle multiple values
        if (!Array.isArray(data[key])) {
          data[key] = [data[key]];
        }
        data[key].push(value);
      } else {
        data[key] = value;
      }
    });

    // Show loading state
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.success) {
        messageEl.textContent = result.message || '${form.successMessage}';
        messageEl.className = 'ksoa-form__message ksoa-form__message--success';
        messageEl.style.display = 'block';
        form.reset();
      } else {
        // Show errors
        if (result.errors) {
          result.errors.forEach(err => {
            const fieldEl = form.querySelector('[data-field="' + err.field + '"]');
            const errorEl = form.querySelector('[data-error="' + err.field + '"]');
            if (fieldEl) fieldEl.classList.add('ksoa-form__field--error');
            if (errorEl) errorEl.textContent = err.message;
          });
        }
        messageEl.textContent = result.message || 'Please correct the errors above.';
        messageEl.className = 'ksoa-form__message ksoa-form__message--error';
        messageEl.style.display = 'block';
      }
    } catch (error) {
      messageEl.textContent = 'An error occurred. Please try again later.';
      messageEl.className = 'ksoa-form__message ksoa-form__message--error';
      messageEl.style.display = 'block';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = '${form.submitButtonText}';
    }
  });
})();
`;
  }
}

// Singleton instance
const formBuilderService = new FormBuilderService();

module.exports = { FormBuilderService, formBuilderService };
