# KSOA Sports - GHL CMS Form Builder

A comprehensive form builder and CMS integration for ksoasports.com with Go High Level CRM.

## Overview

This CMS provides:
- Pre-built form templates for KSOA Sports (7 sports)
- Go High Level CRM integration via OAuth 2.0
- Automatic contact and opportunity creation
- Webhook handling for real-time sync
- Embeddable forms for the KSOA website
- Admin interface for form management

## Sports Covered

- Football
- Soccer
- Softball
- Baseball
- Wrestling
- Basketball
- Volleyball

## Form Templates

### General Forms
| Form ID | Description |
|---------|-------------|
| `membership_application` | Full KSOA membership application |
| `interest_form` | Quick interest/lead capture form |
| `training_registration` | Training session registration |
| `event_registration` | Event sign-up form |
| `contact_form` | General contact form |
| `feedback_form` | Member feedback collection |

### Sport-Specific Forms
Each sport has dedicated forms:
- `{sport}_interest` - Interest form pre-filtered to specific sport
- `{sport}_training` - Training registration for specific sport

Example: `football_interest`, `basketball_training`

## Installation

```bash
cd ghl-cms
npm install
```

## Environment Variables

Create a `.env` file with:

```env
# Go High Level API
GHL_CLIENT_ID=your_client_id
GHL_CLIENT_SECRET=your_client_secret
GHL_LOCATION_ID=your_location_id
GHL_REDIRECT_URI=https://ksoasports.com/api/ghl/callback
GHL_WEBHOOK_SECRET=your_webhook_secret

# Optional: Private Integration Token (alternative to OAuth)
GHL_API_KEY=your_api_key
```

## API Endpoints

### Form Submission
```
POST /api/ghl/submit
Content-Type: application/json

{
  "formId": "membership_application",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  ...
}
```

### OAuth Flow
```
GET /api/ghl/oauth/authorize  - Initiate OAuth
GET /api/ghl/oauth/callback   - Handle callback
POST /api/ghl/oauth/disconnect - Disconnect
```

### Webhooks
```
POST /api/ghl/webhook
```
Receives events from GHL:
- `form_submitted`
- `contact_created`
- `contact_updated`
- `appointment_booked`
- `opportunity_created`
- `opportunity_updated`

### Form Templates API
```
GET /api/ghl/forms           - List all forms
GET /api/ghl/forms/:id       - Get specific form
GET /api/ghl/forms/:id/html  - Get rendered HTML
GET /api/ghl/submissions     - List submissions
```

## Embedding Forms

### Method 1: JavaScript Embed (Recommended)

```html
<!-- In your KSOA website page -->
<div id="ksoa-form"></div>
<script src="https://ksoasports.com/ghl-cms/embed.js"></script>
<script>
  KSOAForms.render('membership_application', {
    container: '#ksoa-form',
    theme: 'light', // or 'dark'
    submitEndpoint: '/api/ghl/submit',
    onSuccess: function(result) {
      console.log('Form submitted:', result);
    },
    onError: function(error) {
      console.error('Form error:', error);
    }
  });
</script>
```

### Method 2: Server-Side Render

```javascript
const { formBuilderService, getFormTemplate } = require('./ghl-cms');

const form = getFormTemplate('interest_form');
const html = formBuilderService.generateFormHTML(form, {
  action: '/api/ghl/submit',
  includeStyles: true
});

// Use html in your template
```

### Method 3: iFrame Embed

```html
<iframe
  src="https://ksoasports.com/api/ghl/forms/interest_form/html"
  width="100%"
  height="600"
  frameborder="0">
</iframe>
```

## GHL Custom Fields Setup

The following custom fields must be created in your GHL location:

| Field Key | Type | Description |
|-----------|------|-------------|
| `sports_interested` | Multi-select | Sports the official is interested in |
| `experience_level` | Dropdown | Officiating experience level |
| `years_experience` | Number | Years of officiating experience |
| `kshsaa_registered` | Dropdown | KSHSAA registration status |
| `certification_level` | Dropdown | Current certification level |
| `availability` | Multi-select | Available times to officiate |
| `referee_number` | Text | KSHSAA referee number |
| `emergency_contact` | Text | Emergency contact name |
| `emergency_phone` | Phone | Emergency contact phone |

## GHL Pipeline Setup

### Recommended Pipelines

1. **Membership Pipeline**
   - Stages: Interested → Application Submitted → Under Review → Approved → Active Member

2. **Training Pipeline**
   - Stages: Registered → Scheduled → Completed → Certified

3. **Events Pipeline**
   - Stages: Registered → Confirmed → Attended

## Webhook Configuration in GHL

1. Go to Settings → Webhooks in your GHL location
2. Add webhook URL: `https://ksoasports.com/api/ghl/webhook`
3. Select events:
   - Form Submissions
   - Contact Created
   - Contact Updated
   - Appointment Events
   - Opportunity Events

## Admin Interface

Access the admin dashboard at:
```
https://ksoasports.com/ghl-cms/admin/
```

Features:
- View all form templates
- Filter by sport
- Get embed codes
- Preview forms
- View submissions
- Configure GHL connection
- Manage webhooks

## Usage Examples

### Create a Contact from Form Submission

```javascript
const { GHLApiService, oauthService } = require('./ghl-cms');

async function createContact(formData) {
  const accessToken = await oauthService.getValidAccessToken();
  const api = new GHLApiService(accessToken);

  const contact = await api.createContact({
    firstName: formData.firstName,
    lastName: formData.lastName,
    email: formData.email,
    phone: formData.phone,
    tags: ['New Member', 'Website Lead'],
    customFields: {
      sports_interested: formData.sports,
      experience_level: formData.experience
    }
  });

  return contact;
}
```

### Process Webhook Event

```javascript
const { handleWebhook } = require('./ghl-cms');

// In your Express app
app.post('/api/ghl/webhook', handleWebhook);
```

## File Structure

```
ghl-cms/
├── api/
│   ├── submit.js         # Form submission handler
│   ├── webhook.js        # GHL webhook handler
│   └── oauth-callback.js # OAuth flow handlers
├── admin/
│   └── index.html        # Admin dashboard
├── components/
│   └── embed.js          # Embeddable form script
├── config/
│   └── ghl-config.js     # Configuration
├── services/
│   ├── ghl-api.js        # GHL API client
│   ├── oauth.js          # OAuth service
│   └── form-builder.js   # Form builder service
├── templates/
│   └── form-templates.js # Form definitions
├── index.js              # Main entry point
└── README.md             # This file
```

## API Documentation

For complete GHL API documentation, visit:
- [GHL Developer Portal](https://marketplace.gohighlevel.com/docs/)
- [Contacts API](https://marketplace.gohighlevel.com/docs/ghl/contacts/create-contact/index.html)
- [Custom Fields API](https://marketplace.gohighlevel.com/docs/ghl/custom-fields/custom-fields-v-2-api/index.html)

## Support

For issues and support:
- KSOA: [ksoasports.com/about-us](https://www.ksoasports.com/about-us)
- GHL Support: [help.gohighlevel.com](https://help.gohighlevel.com)

## License

Proprietary - KSOA Sports / Digital Boost Plus
