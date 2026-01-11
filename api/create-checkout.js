const Stripe = require('stripe');

module.exports = async (req, res) => {
    // Only allow POST
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Validate environment variables
    if (!process.env.STRIPE_SECRET_KEY) {
        console.error('Missing STRIPE_SECRET_KEY');
        return res.status(500).json({ error: 'Server Misconfiguration: Missing Stripe Secret Key' });
    }
    if (!process.env.STRIPE_PRICE_ID) {
        console.error('Missing STRIPE_PRICE_ID');
        return res.status(500).json({ error: 'Server Misconfiguration: Missing Stripe Price ID' });
    }

    try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

        // Get the base URL for redirects
        // Default to http for localhost, https otherwise
        const host = req.headers.host;
        const protocol = req.headers['x-forwarded-proto'] || (host.includes('localhost') ? 'http' : 'https');
        const baseUrl = `${protocol}://${host}`;

        console.log('Creating Checkout Session:', { 
            baseUrl, 
            priceId: process.env.STRIPE_PRICE_ID,
            hasSecretKey: !!process.env.STRIPE_SECRET_KEY 
        });

        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            line_items: [
                {
                    price: process.env.STRIPE_PRICE_ID,
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
};
