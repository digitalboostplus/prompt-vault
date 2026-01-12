/**
 * KSOA Sports Form Templates
 * Pre-built form configurations for each sport and use case
 */

const { GHL_CONFIG, FORM_TYPES } = require('../config/ghl-config');

/**
 * Base field definitions used across forms
 */
const BASE_FIELDS = {
  firstName: {
    id: 'firstName',
    type: 'text',
    label: 'First Name',
    placeholder: 'Enter your first name',
    required: true,
    validation: { minLength: 2, maxLength: 50 }
  },
  lastName: {
    id: 'lastName',
    type: 'text',
    label: 'Last Name',
    placeholder: 'Enter your last name',
    required: true,
    validation: { minLength: 2, maxLength: 50 }
  },
  email: {
    id: 'email',
    type: 'email',
    label: 'Email Address',
    placeholder: 'your.email@example.com',
    required: true,
    validation: { pattern: 'email' }
  },
  phone: {
    id: 'phone',
    type: 'tel',
    label: 'Phone Number',
    placeholder: '(555) 123-4567',
    required: true,
    validation: { pattern: 'phone' }
  },
  address: {
    id: 'address',
    type: 'text',
    label: 'Street Address',
    placeholder: '123 Main Street',
    required: false
  },
  city: {
    id: 'city',
    type: 'text',
    label: 'City',
    placeholder: 'City',
    required: false
  },
  state: {
    id: 'state',
    type: 'select',
    label: 'State',
    required: false,
    options: [
      { value: 'KS', label: 'Kansas' },
      { value: 'MO', label: 'Missouri' },
      { value: 'NE', label: 'Nebraska' },
      { value: 'OK', label: 'Oklahoma' },
      { value: 'CO', label: 'Colorado' }
    ]
  },
  zip: {
    id: 'zip',
    type: 'text',
    label: 'ZIP Code',
    placeholder: '66044',
    required: false,
    validation: { pattern: 'zipcode' }
  }
};

/**
 * KSOA-specific field definitions
 */
const KSOA_FIELDS = {
  sportsInterested: {
    id: 'sports_interested',
    type: 'checkbox-group',
    label: 'Sports Interested In',
    required: true,
    options: GHL_CONFIG.sports.map(sport => ({
      value: sport.id,
      label: `${sport.icon} ${sport.name}`
    }))
  },
  experienceLevel: {
    id: 'experience_level',
    type: 'select',
    label: 'Officiating Experience Level',
    required: true,
    options: [
      { value: 'none', label: 'No Experience - Just Starting' },
      { value: 'beginner', label: '1-2 Years Experience' },
      { value: 'intermediate', label: '3-5 Years Experience' },
      { value: 'advanced', label: '6-10 Years Experience' },
      { value: 'veteran', label: '10+ Years Experience' }
    ]
  },
  yearsExperience: {
    id: 'years_experience',
    type: 'number',
    label: 'Years of Officiating Experience',
    placeholder: '0',
    required: false,
    validation: { min: 0, max: 50 }
  },
  kshsaaRegistered: {
    id: 'kshsaa_registered',
    type: 'radio',
    label: 'Are you registered with KSHSAA?',
    required: true,
    helpText: 'Kansas State High School Activities Association',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
      { value: 'planning', label: 'Planning to register' }
    ]
  },
  certificationLevel: {
    id: 'certification_level',
    type: 'select',
    label: 'Current Certification Level',
    required: false,
    options: [
      { value: 'none', label: 'No Certification' },
      { value: 'local', label: 'Local/Youth Level' },
      { value: 'varsity', label: 'High School Varsity' },
      { value: 'college', label: 'College Level' },
      { value: 'professional', label: 'Professional' }
    ]
  },
  availability: {
    id: 'availability',
    type: 'checkbox-group',
    label: 'Availability',
    required: true,
    options: [
      { value: 'weekday_afternoon', label: 'Weekday Afternoons' },
      { value: 'weekday_evening', label: 'Weekday Evenings' },
      { value: 'saturday', label: 'Saturdays' },
      { value: 'sunday', label: 'Sundays' }
    ]
  },
  refereeNumber: {
    id: 'referee_number',
    type: 'text',
    label: 'KSHSAA Referee Number (if applicable)',
    placeholder: 'REF-XXXXX',
    required: false
  },
  emergencyContact: {
    id: 'emergency_contact',
    type: 'text',
    label: 'Emergency Contact Name',
    placeholder: 'Contact name',
    required: true
  },
  emergencyPhone: {
    id: 'emergency_phone',
    type: 'tel',
    label: 'Emergency Contact Phone',
    placeholder: '(555) 123-4567',
    required: true
  },
  howDidYouHear: {
    id: 'how_did_you_hear',
    type: 'select',
    label: 'How did you hear about KSOA?',
    required: false,
    options: [
      { value: 'referral', label: 'Referral from another official' },
      { value: 'school', label: 'School/Athletic Director' },
      { value: 'website', label: 'KSOA Website' },
      { value: 'social', label: 'Social Media' },
      { value: 'event', label: 'Sporting Event' },
      { value: 'other', label: 'Other' }
    ]
  },
  message: {
    id: 'message',
    type: 'textarea',
    label: 'Additional Information / Questions',
    placeholder: 'Tell us more about yourself or ask any questions...',
    required: false,
    validation: { maxLength: 1000 }
  }
};

/**
 * Form Templates
 */
const FORM_TEMPLATES = {
  // ==================== MEMBERSHIP APPLICATION ====================
  membership_application: {
    id: 'membership_application',
    name: 'KSOA Membership Application',
    description: 'Apply to become a KSOA member official',
    type: FORM_TYPES.MEMBERSHIP_APPLICATION,
    submitButtonText: 'Submit Application',
    successMessage: 'Thank you for your application! We will review it and contact you within 3-5 business days.',
    sections: [
      {
        id: 'personal_info',
        title: 'Personal Information',
        fields: [
          BASE_FIELDS.firstName,
          BASE_FIELDS.lastName,
          BASE_FIELDS.email,
          BASE_FIELDS.phone,
          BASE_FIELDS.address,
          BASE_FIELDS.city,
          BASE_FIELDS.state,
          BASE_FIELDS.zip
        ]
      },
      {
        id: 'sports_selection',
        title: 'Sports Selection',
        description: 'Select the sport(s) you want to officiate. Dues: $35 (1 sport), $45 (2 sports), $55 (3+ sports)',
        fields: [
          KSOA_FIELDS.sportsInterested
        ]
      },
      {
        id: 'experience',
        title: 'Experience & Qualifications',
        fields: [
          KSOA_FIELDS.experienceLevel,
          KSOA_FIELDS.yearsExperience,
          KSOA_FIELDS.kshsaaRegistered,
          KSOA_FIELDS.certificationLevel,
          KSOA_FIELDS.refereeNumber
        ]
      },
      {
        id: 'availability_section',
        title: 'Availability',
        fields: [
          KSOA_FIELDS.availability
        ]
      },
      {
        id: 'emergency',
        title: 'Emergency Contact',
        fields: [
          KSOA_FIELDS.emergencyContact,
          KSOA_FIELDS.emergencyPhone
        ]
      },
      {
        id: 'additional',
        title: 'Additional Information',
        fields: [
          KSOA_FIELDS.howDidYouHear,
          KSOA_FIELDS.message
        ]
      }
    ],
    ghlMapping: {
      pipeline: 'membership_pipeline',
      stage: 'new_application',
      tags: ['New Member', 'Pending Review']
    }
  },

  // ==================== INTEREST / GET INVOLVED FORM ====================
  interest_form: {
    id: 'interest_form',
    name: 'Get Involved - Interest Form',
    description: 'Express interest in becoming a sports official',
    type: FORM_TYPES.INTEREST_FORM,
    submitButtonText: 'Submit Interest',
    successMessage: 'Thank you for your interest! A KSOA representative will contact you soon.',
    sections: [
      {
        id: 'contact_info',
        title: 'Contact Information',
        fields: [
          BASE_FIELDS.firstName,
          BASE_FIELDS.lastName,
          BASE_FIELDS.email,
          BASE_FIELDS.phone
        ]
      },
      {
        id: 'interests',
        title: 'Your Interests',
        fields: [
          KSOA_FIELDS.sportsInterested,
          KSOA_FIELDS.experienceLevel,
          KSOA_FIELDS.howDidYouHear,
          KSOA_FIELDS.message
        ]
      }
    ],
    ghlMapping: {
      pipeline: 'membership_pipeline',
      stage: 'interested',
      tags: ['Interested', 'Lead']
    }
  },

  // ==================== TRAINING REGISTRATION ====================
  training_registration: {
    id: 'training_registration',
    name: 'Training Session Registration',
    description: 'Register for KSOA training sessions and clinics',
    type: FORM_TYPES.TRAINING_REGISTRATION,
    submitButtonText: 'Register for Training',
    successMessage: 'You have been registered for the training session. Check your email for confirmation details.',
    sections: [
      {
        id: 'participant_info',
        title: 'Participant Information',
        fields: [
          BASE_FIELDS.firstName,
          BASE_FIELDS.lastName,
          BASE_FIELDS.email,
          BASE_FIELDS.phone
        ]
      },
      {
        id: 'training_selection',
        title: 'Training Selection',
        fields: [
          {
            id: 'training_sport',
            type: 'select',
            label: 'Select Sport for Training',
            required: true,
            options: GHL_CONFIG.sports.map(sport => ({
              value: sport.id,
              label: sport.name
            }))
          },
          {
            id: 'training_type',
            type: 'select',
            label: 'Training Type',
            required: true,
            options: [
              { value: 'new_official', label: 'New Official Training' },
              { value: 'rules_clinic', label: 'Rules Clinic' },
              { value: 'advanced', label: 'Advanced Mechanics' },
              { value: 'evaluation', label: 'Evaluation Session' },
              { value: 'mentorship', label: 'Mentorship Program' }
            ]
          },
          KSOA_FIELDS.experienceLevel
        ]
      },
      {
        id: 'additional_info',
        title: 'Additional Information',
        fields: [
          KSOA_FIELDS.message
        ]
      }
    ],
    ghlMapping: {
      pipeline: 'training_pipeline',
      stage: 'registered',
      tags: ['Training Registered']
    }
  },

  // ==================== EVENT REGISTRATION ====================
  event_registration: {
    id: 'event_registration',
    name: 'Event Registration',
    description: 'Register for KSOA events, meetings, and activities',
    type: FORM_TYPES.EVENT_REGISTRATION,
    submitButtonText: 'Register for Event',
    successMessage: 'You have been registered for the event. A confirmation email will be sent shortly.',
    sections: [
      {
        id: 'attendee_info',
        title: 'Attendee Information',
        fields: [
          BASE_FIELDS.firstName,
          BASE_FIELDS.lastName,
          BASE_FIELDS.email,
          BASE_FIELDS.phone
        ]
      },
      {
        id: 'event_details',
        title: 'Event Details',
        fields: [
          {
            id: 'event_name',
            type: 'select',
            label: 'Select Event',
            required: true,
            dynamicOptions: true, // Options loaded dynamically
            placeholder: 'Choose an event...'
          },
          {
            id: 'dietary_restrictions',
            type: 'text',
            label: 'Dietary Restrictions (if applicable)',
            placeholder: 'Any dietary needs...',
            required: false
          },
          {
            id: 'guest_count',
            type: 'number',
            label: 'Number of Guests (including yourself)',
            placeholder: '1',
            required: true,
            validation: { min: 1, max: 5 }
          }
        ]
      },
      {
        id: 'notes',
        title: 'Additional Notes',
        fields: [
          KSOA_FIELDS.message
        ]
      }
    ],
    ghlMapping: {
      pipeline: 'events_pipeline',
      stage: 'registered',
      tags: ['Event Registered']
    }
  },

  // ==================== CONTACT FORM ====================
  contact_form: {
    id: 'contact_form',
    name: 'Contact Us',
    description: 'General contact and inquiry form',
    type: FORM_TYPES.CONTACT_FORM,
    submitButtonText: 'Send Message',
    successMessage: 'Thank you for your message! We will respond within 24-48 hours.',
    sections: [
      {
        id: 'contact_info',
        title: 'Your Information',
        fields: [
          BASE_FIELDS.firstName,
          BASE_FIELDS.lastName,
          BASE_FIELDS.email,
          BASE_FIELDS.phone
        ]
      },
      {
        id: 'inquiry',
        title: 'Your Message',
        fields: [
          {
            id: 'subject',
            type: 'select',
            label: 'Subject',
            required: true,
            options: [
              { value: 'general', label: 'General Inquiry' },
              { value: 'membership', label: 'Membership Questions' },
              { value: 'training', label: 'Training Information' },
              { value: 'scheduling', label: 'Game Scheduling' },
              { value: 'feedback', label: 'Feedback' },
              { value: 'other', label: 'Other' }
            ]
          },
          {
            ...KSOA_FIELDS.message,
            required: true,
            label: 'Your Message'
          }
        ]
      }
    ],
    ghlMapping: {
      tags: ['Contact Form Submission']
    }
  },

  // ==================== FEEDBACK FORM ====================
  feedback_form: {
    id: 'feedback_form',
    name: 'Member Feedback',
    description: 'Share your feedback about KSOA',
    type: FORM_TYPES.FEEDBACK_FORM,
    submitButtonText: 'Submit Feedback',
    successMessage: 'Thank you for your feedback! We value your input.',
    sections: [
      {
        id: 'member_info',
        title: 'Your Information (Optional)',
        fields: [
          { ...BASE_FIELDS.firstName, required: false },
          { ...BASE_FIELDS.lastName, required: false },
          { ...BASE_FIELDS.email, required: false }
        ]
      },
      {
        id: 'feedback_content',
        title: 'Your Feedback',
        fields: [
          {
            id: 'feedback_type',
            type: 'select',
            label: 'Feedback Type',
            required: true,
            options: [
              { value: 'compliment', label: 'Compliment' },
              { value: 'suggestion', label: 'Suggestion' },
              { value: 'concern', label: 'Concern' },
              { value: 'question', label: 'Question' }
            ]
          },
          {
            id: 'feedback_about',
            type: 'select',
            label: 'Feedback About',
            required: true,
            options: [
              { value: 'training', label: 'Training Programs' },
              { value: 'communication', label: 'Communication' },
              { value: 'website', label: 'Website' },
              { value: 'events', label: 'Events' },
              { value: 'leadership', label: 'Leadership/Board' },
              { value: 'other', label: 'Other' }
            ]
          },
          {
            id: 'rating',
            type: 'radio',
            label: 'Overall KSOA Experience Rating',
            required: true,
            options: [
              { value: '5', label: 'Excellent' },
              { value: '4', label: 'Good' },
              { value: '3', label: 'Average' },
              { value: '2', label: 'Below Average' },
              { value: '1', label: 'Poor' }
            ]
          },
          {
            ...KSOA_FIELDS.message,
            required: true,
            label: 'Your Feedback'
          }
        ]
      }
    ],
    ghlMapping: {
      tags: ['Feedback Received']
    }
  }
};

/**
 * Sport-specific form variations
 * Each sport can have customized versions of the base templates
 */
const SPORT_SPECIFIC_FORMS = {};

GHL_CONFIG.sports.forEach(sport => {
  // Interest form for each sport
  SPORT_SPECIFIC_FORMS[`${sport.id}_interest`] = {
    ...FORM_TEMPLATES.interest_form,
    id: `${sport.id}_interest`,
    name: `${sport.name} Official - Interest Form`,
    description: `Express interest in becoming a ${sport.name} official`,
    sections: FORM_TEMPLATES.interest_form.sections.map(section => {
      if (section.id === 'interests') {
        return {
          ...section,
          fields: section.fields.map(field => {
            if (field.id === 'sports_interested') {
              return {
                ...field,
                type: 'hidden',
                defaultValue: [sport.id]
              };
            }
            return field;
          })
        };
      }
      return section;
    }),
    ghlMapping: {
      ...FORM_TEMPLATES.interest_form.ghlMapping,
      tags: ['Interested', 'Lead', sport.name]
    }
  };

  // Training registration for each sport
  SPORT_SPECIFIC_FORMS[`${sport.id}_training`] = {
    ...FORM_TEMPLATES.training_registration,
    id: `${sport.id}_training`,
    name: `${sport.name} Training Registration`,
    description: `Register for ${sport.name} officiating training`,
    ghlMapping: {
      ...FORM_TEMPLATES.training_registration.ghlMapping,
      tags: ['Training Registered', sport.name]
    }
  };
});

/**
 * Get form template by ID
 * @param {string} formId - Form template ID
 */
function getFormTemplate(formId) {
  return FORM_TEMPLATES[formId] || SPORT_SPECIFIC_FORMS[formId] || null;
}

/**
 * Get all form templates
 */
function getAllFormTemplates() {
  return {
    ...FORM_TEMPLATES,
    ...SPORT_SPECIFIC_FORMS
  };
}

/**
 * Get forms by type
 * @param {string} type - Form type from FORM_TYPES
 */
function getFormsByType(type) {
  const allForms = getAllFormTemplates();
  return Object.values(allForms).filter(form => form.type === type);
}

module.exports = {
  BASE_FIELDS,
  KSOA_FIELDS,
  FORM_TEMPLATES,
  SPORT_SPECIFIC_FORMS,
  getFormTemplate,
  getAllFormTemplates,
  getFormsByType
};
