const { onRequest } = require('firebase-functions/v2/https');
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Stripe = require('stripe');
const { Resend } = require('resend');
const cors = require('cors')({ origin: true });
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

admin.initializeApp();

// Using defineSecret for safer key management in production, 
// but falling back to process.env for easier defined variables.
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripePriceId = process.env.STRIPE_PRICE_ID;
const resendApiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.FROM_EMAIL;
const downloadSecret = process.env.DOWNLOAD_SECRET || 'default-secret';
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

// 1. Create Checkout Session
exports.createCheckout = onRequest({ cors: true }, async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        if (!stripe) {
            throw new Error('Stripe is not configured. Missing STRIPE_SECRET_KEY.');
        }

        const protocol = req.headers['x-forwarded-proto'] || 'https';
        const host = req.headers.host;
        const origin = req.get('Origin') || req.get('Referer');
        const baseUrl = origin ? origin.replace(/\/$/, '') : `https://${process.env.GCLOUD_PROJECT}.web.app`;

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            line_items: [
                {
                    price: stripePriceId,
                    quantity: 1,
                },
            ],
            success_url: `${baseUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${baseUrl}/#pricing`,
            customer_creation: 'always',
            metadata: {
                product: 'prompt-vault-500'
            }
        });

        res.status(200).json({ url: session.url });
    } catch (error) {
        console.error('Stripe checkout error:', error);
        res.status(500).json({ error: 'Failed to create checkout session' });
    }
});

// 2. Webhook Handler
exports.webhook = onRequest(async (req, res) => {
    const sig = req.headers['stripe-signature'];

    let event;

    try {
        if (!stripe) {
            throw new Error('Stripe is not configured.');
        }
        event = stripe.webhooks.constructEvent(req.rawBody, sig, stripeWebhookSecret);
    } catch (err) {
        console.error(`Webhook signature verification failed.`, err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const customerEmail = session.customer_details?.email;
        const customerName = session.customer_details?.name || 'Customer';

        if (customerEmail) {
            // Generate download link (+24 hours expiry)
            const expires = Date.now() + (24 * 60 * 60 * 1000);
            const sessionId = session.id;

            // Create signature
            const dataToSign = `${sessionId}:${expires}`;
            const signature = crypto
                .createHmac('sha256', downloadSecret)
                .update(dataToSign)
                .digest('hex');

            const token = Buffer.from(`${sessionId}:${expires}:${signature}`).toString('base64url');

            // We need the hosting URL again. 
            // best is to use an env var for public URL, or guess from project ID.
            const projectUrl = `https://${process.env.GCLOUD_PROJECT}.web.app`;
            const downloadLink = `${projectUrl}/api/download?token=${token}`;

            console.log(`Sending email to ${customerEmail}`);

            try {
                if (!resend) {
                    console.error('Resend is not configured. Missing RESEND_API_KEY.');
                    return;
                }
                // Assuming we want to send the email via Resend
                await resend.emails.send({
                    from: fromEmail || 'Prompt Vault <onboarding@resend.dev>',
                    to: customerEmail,
                    subject: 'Your Prompt Vault Download',
                    html: `
                        <h1>Thank you for your purchase!</h1>
                        <p>Hi ${customerName},</p>
                        <p>Here is your link to download the Prompt Vault:</p>
                        <p><a href="${downloadLink}" style="padding: 12px 24px; background-color: #000; color: #fff; text-decoration: none; border-radius: 6px;">Download Now</a></p>
                        <p><small>This link expires in 24 hours.</small></p>
                    `
                });
            } catch (emailError) {
                console.error('Failed to send email:', emailError);
            }
        }
    }

    res.json({ received: true });
});

// 3. Download Handler
exports.download = onRequest(async (req, res) => {
    // Handling large files in Functions can be memory intensive.
    // Ideally user generates a signed URL for Firebase Storage.
    // But to match the previous logic, we'll try to stream from local file.
    // NOTE: The zip file must be included in the deployment!

    const { token } = req.query;

    if (!token) {
        return res.status(400).json({ error: 'Missing download token' });
    }

    try {
        const decoded = Buffer.from(token, 'base64url').toString('utf8');
        const [sessionId, expires, signature] = decoded.split(':');

        const data = `${sessionId}:${expires}`;
        const expectedSignature = crypto
            .createHmac('sha256', downloadSecret)
            .update(data)
            .digest('hex');

        if (signature !== expectedSignature) {
            return res.status(403).json({ error: 'Invalid download token' });
        }

        if (Date.now() > parseInt(expires)) {
            return res.status(410).json({ error: 'Download link has expired' });
        }

        // Locate the file relative to this function
        // We will ensure 'downloads/prompt-vault.zip' is included in functions folder
        const filePath = path.join(__dirname, 'downloads', 'prompt-vault.zip');

        if (!fs.existsSync(filePath)) {
            console.error('File not found at:', filePath);
            return res.status(500).json({ error: 'System error: File missing' });
        }

        const stat = fs.statSync(filePath);
        const fileStream = fs.createReadStream(filePath);

        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', 'attachment; filename="prompt-vault-500-business-prompts.zip"');
        res.setHeader('Content-Length', stat.size);

        fileStream.pipe(res);
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ error: 'Download failed' });
    }
});
