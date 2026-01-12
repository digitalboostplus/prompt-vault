/**
 * KSOA Forms Embed Script
 * Embeddable form renderer for ksoasports.com
 *
 * Usage:
 * <div id="ksoa-form"></div>
 * <script src="https://ksoasports.com/ghl-cms/embed.js"></script>
 * <script>
 *   KSOAForms.render('membership_application', {
 *     container: '#ksoa-form',
 *     theme: 'light'
 *   });
 * </script>
 */

(function(window) {
  'use strict';

  // Form Templates (simplified for embed)
  const FORM_TEMPLATES = {
    membership_application: {
      name: 'KSOA Membership Application',
      submitText: 'Submit Application',
      successMessage: 'Thank you for your application! We will review it and contact you within 3-5 business days.',
      sections: [
        {
          title: 'Personal Information',
          fields: [
            { id: 'firstName', type: 'text', label: 'First Name', required: true },
            { id: 'lastName', type: 'text', label: 'Last Name', required: true },
            { id: 'email', type: 'email', label: 'Email Address', required: true },
            { id: 'phone', type: 'tel', label: 'Phone Number', required: true },
            { id: 'address', type: 'text', label: 'Street Address' },
            { id: 'city', type: 'text', label: 'City' },
            { id: 'state', type: 'select', label: 'State', options: [
              { value: 'KS', label: 'Kansas' },
              { value: 'MO', label: 'Missouri' },
              { value: 'NE', label: 'Nebraska' },
              { value: 'OK', label: 'Oklahoma' },
              { value: 'CO', label: 'Colorado' }
            ]},
            { id: 'zip', type: 'text', label: 'ZIP Code' }
          ]
        },
        {
          title: 'Sports Selection',
          description: 'Dues: $35 (1 sport), $45 (2 sports), $55 (3+ sports)',
          fields: [
            { id: 'sports_interested', type: 'checkbox-group', label: 'Sports Interested In', required: true, options: [
              { value: 'football', label: 'Football' },
              { value: 'soccer', label: 'Soccer' },
              { value: 'softball', label: 'Softball' },
              { value: 'baseball', label: 'Baseball' },
              { value: 'wrestling', label: 'Wrestling' },
              { value: 'basketball', label: 'Basketball' },
              { value: 'volleyball', label: 'Volleyball' }
            ]}
          ]
        },
        {
          title: 'Experience',
          fields: [
            { id: 'experience_level', type: 'select', label: 'Experience Level', required: true, options: [
              { value: 'none', label: 'No Experience' },
              { value: 'beginner', label: '1-2 Years' },
              { value: 'intermediate', label: '3-5 Years' },
              { value: 'advanced', label: '6-10 Years' },
              { value: 'veteran', label: '10+ Years' }
            ]},
            { id: 'kshsaa_registered', type: 'radio', label: 'KSHSAA Registered?', required: true, options: [
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' },
              { value: 'planning', label: 'Planning to register' }
            ]}
          ]
        },
        {
          title: 'Emergency Contact',
          fields: [
            { id: 'emergency_contact', type: 'text', label: 'Emergency Contact Name', required: true },
            { id: 'emergency_phone', type: 'tel', label: 'Emergency Contact Phone', required: true }
          ]
        }
      ]
    },

    interest_form: {
      name: 'Get Involved - Interest Form',
      submitText: 'Submit Interest',
      successMessage: 'Thank you for your interest! A KSOA representative will contact you soon.',
      sections: [
        {
          title: 'Contact Information',
          fields: [
            { id: 'firstName', type: 'text', label: 'First Name', required: true },
            { id: 'lastName', type: 'text', label: 'Last Name', required: true },
            { id: 'email', type: 'email', label: 'Email Address', required: true },
            { id: 'phone', type: 'tel', label: 'Phone Number', required: true }
          ]
        },
        {
          title: 'Your Interests',
          fields: [
            { id: 'sports_interested', type: 'checkbox-group', label: 'Sports Interested In', required: true, options: [
              { value: 'football', label: 'Football' },
              { value: 'soccer', label: 'Soccer' },
              { value: 'softball', label: 'Softball' },
              { value: 'baseball', label: 'Baseball' },
              { value: 'wrestling', label: 'Wrestling' },
              { value: 'basketball', label: 'Basketball' },
              { value: 'volleyball', label: 'Volleyball' }
            ]},
            { id: 'experience_level', type: 'select', label: 'Experience Level', required: true, options: [
              { value: 'none', label: 'No Experience' },
              { value: 'beginner', label: '1-2 Years' },
              { value: 'intermediate', label: '3-5 Years' },
              { value: 'advanced', label: '6-10 Years' },
              { value: 'veteran', label: '10+ Years' }
            ]},
            { id: 'message', type: 'textarea', label: 'Additional Information' }
          ]
        }
      ]
    },

    contact_form: {
      name: 'Contact Us',
      submitText: 'Send Message',
      successMessage: 'Thank you for your message! We will respond within 24-48 hours.',
      sections: [
        {
          title: 'Your Information',
          fields: [
            { id: 'firstName', type: 'text', label: 'First Name', required: true },
            { id: 'lastName', type: 'text', label: 'Last Name', required: true },
            { id: 'email', type: 'email', label: 'Email Address', required: true },
            { id: 'phone', type: 'tel', label: 'Phone Number' }
          ]
        },
        {
          title: 'Your Message',
          fields: [
            { id: 'subject', type: 'select', label: 'Subject', required: true, options: [
              { value: 'general', label: 'General Inquiry' },
              { value: 'membership', label: 'Membership Questions' },
              { value: 'training', label: 'Training Information' },
              { value: 'scheduling', label: 'Game Scheduling' },
              { value: 'feedback', label: 'Feedback' },
              { value: 'other', label: 'Other' }
            ]},
            { id: 'message', type: 'textarea', label: 'Your Message', required: true }
          ]
        }
      ]
    },

    training_registration: {
      name: 'Training Registration',
      submitText: 'Register for Training',
      successMessage: 'You have been registered for the training session.',
      sections: [
        {
          title: 'Participant Information',
          fields: [
            { id: 'firstName', type: 'text', label: 'First Name', required: true },
            { id: 'lastName', type: 'text', label: 'Last Name', required: true },
            { id: 'email', type: 'email', label: 'Email Address', required: true },
            { id: 'phone', type: 'tel', label: 'Phone Number', required: true }
          ]
        },
        {
          title: 'Training Selection',
          fields: [
            { id: 'training_sport', type: 'select', label: 'Sport', required: true, options: [
              { value: 'football', label: 'Football' },
              { value: 'soccer', label: 'Soccer' },
              { value: 'softball', label: 'Softball' },
              { value: 'baseball', label: 'Baseball' },
              { value: 'wrestling', label: 'Wrestling' },
              { value: 'basketball', label: 'Basketball' },
              { value: 'volleyball', label: 'Volleyball' }
            ]},
            { id: 'training_type', type: 'select', label: 'Training Type', required: true, options: [
              { value: 'new_official', label: 'New Official Training' },
              { value: 'rules_clinic', label: 'Rules Clinic' },
              { value: 'advanced', label: 'Advanced Mechanics' },
              { value: 'evaluation', label: 'Evaluation Session' }
            ]},
            { id: 'experience_level', type: 'select', label: 'Experience Level', required: true, options: [
              { value: 'none', label: 'No Experience' },
              { value: 'beginner', label: '1-2 Years' },
              { value: 'intermediate', label: '3-5 Years' },
              { value: 'advanced', label: '6-10 Years' },
              { value: 'veteran', label: '10+ Years' }
            ]}
          ]
        }
      ]
    }
  };

  // Sport-specific forms
  const SPORTS = ['football', 'soccer', 'softball', 'baseball', 'wrestling', 'basketball', 'volleyball'];

  SPORTS.forEach(sport => {
    const sportName = sport.charAt(0).toUpperCase() + sport.slice(1);

    // Interest form for each sport
    FORM_TEMPLATES[`${sport}_interest`] = {
      ...FORM_TEMPLATES.interest_form,
      name: `${sportName} Official - Interest Form`,
      sections: FORM_TEMPLATES.interest_form.sections.map(section => ({
        ...section,
        fields: section.fields.map(field => {
          if (field.id === 'sports_interested') {
            return { ...field, type: 'hidden', defaultValue: sport };
          }
          return field;
        })
      }))
    };

    // Training form for each sport
    FORM_TEMPLATES[`${sport}_training`] = {
      ...FORM_TEMPLATES.training_registration,
      name: `${sportName} Training Registration`,
      sections: FORM_TEMPLATES.training_registration.sections.map(section => ({
        ...section,
        fields: section.fields.map(field => {
          if (field.id === 'training_sport') {
            return { ...field, type: 'hidden', defaultValue: sport };
          }
          return field;
        })
      }))
    };
  });

  /**
   * KSOAForms - Main namespace
   */
  const KSOAForms = {
    version: '1.0.0',
    baseUrl: 'https://ksoasports.com',

    /**
     * Render a form
     * @param {string} formId - Form template ID
     * @param {Object} options - Rendering options
     */
    render: function(formId, options = {}) {
      const template = FORM_TEMPLATES[formId];

      if (!template) {
        console.error(`KSOA Forms: Template "${formId}" not found`);
        return;
      }

      const {
        container = '#ksoa-form',
        theme = 'light',
        submitEndpoint = '/api/ghl/submit',
        onSuccess = null,
        onError = null
      } = options;

      const containerEl = typeof container === 'string'
        ? document.querySelector(container)
        : container;

      if (!containerEl) {
        console.error(`KSOA Forms: Container "${container}" not found`);
        return;
      }

      // Inject styles
      this.injectStyles(theme);

      // Render form HTML
      containerEl.innerHTML = this.generateFormHTML(formId, template, submitEndpoint);

      // Attach event handlers
      this.attachHandlers(formId, template, submitEndpoint, onSuccess, onError);
    },

    /**
     * Inject CSS styles
     */
    injectStyles: function(theme) {
      if (document.getElementById('ksoa-forms-styles')) return;

      const isDark = theme === 'dark';

      const styles = document.createElement('style');
      styles.id = 'ksoa-forms-styles';
      styles.textContent = `
        .ksoa-form {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          max-width: 700px;
          margin: 0 auto;
          color: ${isDark ? '#e2e8f0' : '#1e293b'};
        }

        .ksoa-form__section {
          background: ${isDark ? '#1e293b' : '#ffffff'};
          border: 1px solid ${isDark ? '#334155' : '#e2e8f0'};
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 20px;
        }

        .ksoa-form__section-title {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 4px;
          color: ${isDark ? '#f1f5f9' : '#0f172a'};
        }

        .ksoa-form__section-desc {
          font-size: 0.875rem;
          color: ${isDark ? '#94a3b8' : '#64748b'};
          margin-bottom: 16px;
        }

        .ksoa-form__field {
          margin-bottom: 16px;
        }

        .ksoa-form__label {
          display: block;
          font-weight: 500;
          margin-bottom: 6px;
          font-size: 0.875rem;
        }

        .ksoa-form__label .required {
          color: #ef4444;
          margin-left: 2px;
        }

        .ksoa-form__input,
        .ksoa-form__select,
        .ksoa-form__textarea {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid ${isDark ? '#475569' : '#cbd5e1'};
          border-radius: 8px;
          font-size: 1rem;
          background: ${isDark ? '#0f172a' : '#ffffff'};
          color: ${isDark ? '#e2e8f0' : '#1e293b'};
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .ksoa-form__input:focus,
        .ksoa-form__select:focus,
        .ksoa-form__textarea:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
        }

        .ksoa-form__textarea {
          min-height: 100px;
          resize: vertical;
        }

        .ksoa-form__checkbox-group,
        .ksoa-form__radio-group {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .ksoa-form__checkbox-label,
        .ksoa-form__radio-label {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          font-size: 0.9375rem;
        }

        .ksoa-form__checkbox,
        .ksoa-form__radio {
          width: 18px;
          height: 18px;
          accent-color: #2563eb;
        }

        .ksoa-form__error {
          color: #ef4444;
          font-size: 0.75rem;
          margin-top: 4px;
          display: none;
        }

        .ksoa-form__field--error .ksoa-form__error {
          display: block;
        }

        .ksoa-form__field--error .ksoa-form__input,
        .ksoa-form__field--error .ksoa-form__select,
        .ksoa-form__field--error .ksoa-form__textarea {
          border-color: #ef4444;
        }

        .ksoa-form__submit {
          display: block;
          width: 100%;
          padding: 14px 24px;
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
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
          display: none;
        }

        .ksoa-form__message--success {
          display: block;
          background: #d1fae5;
          color: #065f46;
        }

        .ksoa-form__message--error {
          display: block;
          background: #fee2e2;
          color: #991b1b;
        }

        .ksoa-form__hidden {
          display: none !important;
        }

        @media (max-width: 640px) {
          .ksoa-form__section {
            padding: 16px;
          }
        }
      `;

      document.head.appendChild(styles);
    },

    /**
     * Generate form HTML
     */
    generateFormHTML: function(formId, template, endpoint) {
      let html = `
        <form id="ksoa-form-${formId}" class="ksoa-form" action="${endpoint}" method="POST">
          <input type="hidden" name="formId" value="${formId}">
      `;

      template.sections.forEach(section => {
        html += `
          <div class="ksoa-form__section">
            <h3 class="ksoa-form__section-title">${section.title}</h3>
            ${section.description ? `<p class="ksoa-form__section-desc">${section.description}</p>` : ''}
        `;

        section.fields.forEach(field => {
          html += this.generateFieldHTML(field);
        });

        html += '</div>';
      });

      html += `
          <button type="submit" class="ksoa-form__submit">${template.submitText}</button>
          <div class="ksoa-form__message" id="ksoa-message-${formId}"></div>
        </form>
      `;

      return html;
    },

    /**
     * Generate field HTML
     */
    generateFieldHTML: function(field) {
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
              class="ksoa-form__input"
              ${field.required ? 'required' : ''}
              ${field.placeholder ? `placeholder="${field.placeholder}"` : ''}
            >
          `;
          break;

        case 'textarea':
          input = `
            <textarea
              id="${field.id}"
              name="${field.id}"
              class="ksoa-form__textarea"
              ${field.required ? 'required' : ''}
              ${field.placeholder ? `placeholder="${field.placeholder}"` : ''}
            ></textarea>
          `;
          break;

        case 'select':
          input = `
            <select id="${field.id}" name="${field.id}" class="ksoa-form__select" ${field.required ? 'required' : ''}>
              <option value="">Select...</option>
              ${field.options.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
            </select>
          `;
          break;

        case 'radio':
          input = `
            <div class="ksoa-form__radio-group">
              ${field.options.map((opt, i) => `
                <label class="ksoa-form__radio-label">
                  <input type="radio" name="${field.id}" value="${opt.value}" class="ksoa-form__radio" ${i === 0 && field.required ? 'required' : ''}>
                  <span>${opt.label}</span>
                </label>
              `).join('')}
            </div>
          `;
          break;

        case 'checkbox-group':
          input = `
            <div class="ksoa-form__checkbox-group">
              ${field.options.map(opt => `
                <label class="ksoa-form__checkbox-label">
                  <input type="checkbox" name="${field.id}" value="${opt.value}" class="ksoa-form__checkbox">
                  <span>${opt.label}</span>
                </label>
              `).join('')}
            </div>
          `;
          break;
      }

      return `
        <div class="ksoa-form__field" data-field="${field.id}">
          <label for="${field.id}" class="ksoa-form__label">
            ${field.label}
            ${field.required ? '<span class="required">*</span>' : ''}
          </label>
          ${input}
          <span class="ksoa-form__error" data-error="${field.id}"></span>
        </div>
      `;
    },

    /**
     * Attach form event handlers
     */
    attachHandlers: function(formId, template, endpoint, onSuccess, onError) {
      const form = document.getElementById(`ksoa-form-${formId}`);
      const messageEl = document.getElementById(`ksoa-message-${formId}`);
      const submitBtn = form.querySelector('.ksoa-form__submit');

      form.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Clear errors
        form.querySelectorAll('.ksoa-form__field--error').forEach(el => {
          el.classList.remove('ksoa-form__field--error');
        });
        messageEl.className = 'ksoa-form__message';
        messageEl.style.display = 'none';

        // Collect data
        const formData = new FormData(form);
        const data = {};

        // Handle checkbox groups
        form.querySelectorAll('.ksoa-form__checkbox-group').forEach(group => {
          const name = group.querySelector('input').name;
          data[name] = [];
          group.querySelectorAll('input:checked').forEach(cb => {
            data[name].push(cb.value);
          });
        });

        formData.forEach((value, key) => {
          if (!data[key]) {
            data[key] = value;
          }
        });

        // Show loading
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });

          const result = await response.json();

          if (result.success) {
            messageEl.textContent = result.message || template.successMessage;
            messageEl.className = 'ksoa-form__message ksoa-form__message--success';
            form.reset();

            if (onSuccess) onSuccess(result);
          } else {
            if (result.errors) {
              result.errors.forEach(err => {
                const fieldEl = form.querySelector(`[data-field="${err.field}"]`);
                const errorEl = form.querySelector(`[data-error="${err.field}"]`);
                if (fieldEl) fieldEl.classList.add('ksoa-form__field--error');
                if (errorEl) errorEl.textContent = err.message;
              });
            }

            messageEl.textContent = result.message || 'Please correct the errors above.';
            messageEl.className = 'ksoa-form__message ksoa-form__message--error';

            if (onError) onError(result);
          }
        } catch (error) {
          messageEl.textContent = 'An error occurred. Please try again.';
          messageEl.className = 'ksoa-form__message ksoa-form__message--error';

          if (onError) onError({ error: error.message });
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = template.submitText;
        }
      });
    },

    /**
     * Get available form templates
     */
    getTemplates: function() {
      return Object.keys(FORM_TEMPLATES).map(id => ({
        id,
        name: FORM_TEMPLATES[id].name
      }));
    }
  };

  // Expose to global scope
  window.KSOAForms = KSOAForms;

})(window);
