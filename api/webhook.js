const Stripe = require('stripe');
const { Resend } = require('resend');
const { generateDownloadEmail } = require('./email-template');

// Disable body parsing - we need raw body for webhook verification
module.exports.config = {
    api: {
        bodyParser: false,
    },
};

// Helper to get raw body
async function getRawBody(req) {
    return new Promise((resolve, reject) => {
        let data = '';
        req.on('data', chunk => {
            data += chunk;
        });
        req.on('end', () => {
            resolve(data);
        });
        req.on('error', reject);
    });
}

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const resend = new Resend(process.env.RESEND_API_KEY);

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const sig = req.headers['stripe-signature'];

    let event;

    try {
        const rawBody = await getRawBody(req);
        event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;

        // Get customer email
        const customerEmail = session.customer_details?.email;

        if (!customerEmail) {
            console.error('No customer email found in session');
            return res.status(400).json({ error: 'No customer email' });
        }

        // Generate download token (valid for 7 days)
        const downloadToken = generateDownloadToken(session.id);

        // Get the base URL
        const protocol = req.headers['x-forwarded-proto'] || 'https';
        const host = req.headers.host;
        const baseUrl = `${protocol}://${host}`;
        const downloadUrl = `${baseUrl}/api/download?token=${downloadToken}`;

        try {
            // Send email with download link
            await resend.emails.send({
                from: process.env.FROM_EMAIL || 'Prompt Vault <noreply@example.com>',
                to: customerEmail,
                subject: 'Your Prompt Vault Download is Ready',
                html: generateDownloadEmail(downloadUrl),
            });

            console.log(`Download email sent to ${customerEmail}`);
        } catch (emailError) {
            console.error('Failed to send email:', emailError);
            // Don't fail the webhook - payment succeeded
        }
    }

    res.status(200).json({ received: true });
};

// Generate a signed download token
function generateDownloadToken(sessionId) {
    const crypto = require('crypto');
    const expires = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days
    const data = `${sessionId}:${expires}`;
    const signature = crypto
        .createHmac('sha256', process.env.DOWNLOAD_SECRET || 'default-secret')
        .update(data)
        .digest('hex');

    // Base64 encode for URL safety
    return Buffer.from(`${data}:${signature}`).toString('base64url');
}
