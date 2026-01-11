const createCheckout = require('./create-checkout');
const Stripe = require('stripe');

jest.mock('stripe');

describe('create-checkout API', () => {
    let req, res, mockStripeClient;
    const originalEnv = process.env;

    beforeEach(() => {
        jest.resetModules();
        process.env = { ...originalEnv };
        req = {
            method: 'POST',
            headers: {
                host: 'localhost:3000',
                'x-forwarded-proto': 'http'
            }
        };
        res = {
            setHeader: jest.fn(),
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        
        mockStripeClient = {
            checkout: {
                sessions: {
                    create: jest.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/test-session' })
                }
            }
        };
        
        Stripe.mockImplementation(() => mockStripeClient);
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    it('should reject non-POST requests', async () => {
        req.method = 'GET';
        await createCheckout(req, res);
        expect(res.status).toHaveBeenCalledWith(405);
    });

    it('should return 500 if STRIPE_SECRET_KEY is missing', async () => {
        delete process.env.STRIPE_SECRET_KEY;
        process.env.STRIPE_PRICE_ID = 'price_test';
        await createCheckout(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: expect.stringContaining('Missing Stripe Secret Key') });
    });

    it('should return 500 if STRIPE_PRICE_ID is missing', async () => {
        process.env.STRIPE_SECRET_KEY = 'test_key';
        delete process.env.STRIPE_PRICE_ID;
        await createCheckout(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: expect.stringContaining('Missing Stripe Price ID') });
    });

    it('should create a stripe session with correct parameters', async () => {
        process.env.STRIPE_SECRET_KEY = 'test_key';
        process.env.STRIPE_PRICE_ID = 'price_test';

        await createCheckout(req, res);

        expect(Stripe).toHaveBeenCalledWith('test_key');
        expect(mockStripeClient.checkout.sessions.create).toHaveBeenCalledWith(expect.objectContaining({
            payment_method_types: ['card'],
            mode: 'payment',
            line_items: [{
                price: 'price_test',
                quantity: 1
            }],
            success_url: expect.stringContaining('/success.html'),
            metadata: {
                product: 'prompt-vault-500'
            }
        }));
        
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ url: 'https://checkout.stripe.com/test-session' });
    });
});
