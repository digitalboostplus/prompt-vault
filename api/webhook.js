const Stripe = require('stripe');
const { Resend } = require('resend');

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
                html: `
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h1 style="color: #1f2937; font-size: 24px;">Thank you for your purchase!</h1>

                        <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
                            Your Prompt Vault pack with 500 business prompts is ready to download.
                        </p>

                        <div style="margin: 30px 0;">
                            <a href="${downloadUrl}"
                               style="display: inline-block; background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                                Download Your Prompts
                            </a>
                        </div>

                        <p style="color: #6b7280; font-size: 14px;">
                            This download link expires in 7 days. If you need a new link, reply to this email.
                        </p>

                        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

                        <h2 style="color: #1f2937; font-size: 18px;">What's included:</h2>
                        <ul style="color: #6b7280; font-size: 14px; line-height: 1.8;">
                            <li>500 prompts across 10 business categories</li>
                            <li>Markdown files organized by category</li>
                            <li>Complete PDF for easy reference</li>
                        </ul>

                        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                            Questions? Just reply to this email.<br>
                            <br>
                            Best,<br>
                            Prompt Vault
                        </p>
                    </div>
                `,
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
