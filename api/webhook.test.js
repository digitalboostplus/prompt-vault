const webhook = require('./webhook');
const Stripe = require('stripe');
const { Resend } = require('resend');

jest.mock('stripe');
jest.mock('resend');

describe('webhook API', () => {
    let req, res, mockStripeClient, mockResendClient;

    beforeEach(() => {
        req = {
            method: 'POST',
            headers: {
                'stripe-signature': 'test_sig',
                host: 'localhost:3000',
                'x-forwarded-proto': 'http'
            },
            on: jest.fn((event, cb) => {
                if (event === 'data') cb('raw_body_content');
                if (event === 'end') cb();
            })
        };
        res = {
            setHeader: jest.fn(),
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        
        mockStripeClient = {
            webhooks: {
                constructEvent: jest.fn()
            }
        };
        
        mockResendClient = {
            emails: {
                send: jest.fn().mockResolvedValue({ id: 'email_id' })
            }
        };

        Stripe.mockImplementation(() => mockStripeClient);
        Resend.mockImplementation(() => mockResendClient);
        process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
    });

    it('should reject non-POST requests', async () => {
        req.method = 'GET';
        await webhook(req, res);
        expect(res.status).toHaveBeenCalledWith(405);
    });

    it('should return 400 if signature verification fails', async () => {
        mockStripeClient.webhooks.constructEvent.mockImplementation(() => {
            throw new Error('Invalid signature');
        });

        await webhook(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('Webhook Error') }));
    });

    it('should process checkout.session.completed event', async () => {
        const mockSession = {
            id: 'sess_123',
            customer_details: { email: 'test@example.com' }
        };
        
        mockStripeClient.webhooks.constructEvent.mockReturnValue({
            type: 'checkout.session.completed',
            data: { object: mockSession }
        });

        await webhook(req, res);

        expect(mockStripeClient.webhooks.constructEvent).toHaveBeenCalledWith('raw_body_content', 'test_sig', 'whsec_test');
        expect(mockResendClient.emails.send).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ received: true });
    });

    it('should handle missing customer email', async () => {
         const mockSession = {
            id: 'sess_123',
            customer_details: { email: null }
        };
        
        mockStripeClient.webhooks.constructEvent.mockReturnValue({
            type: 'checkout.session.completed',
            data: { object: mockSession }
        });

        await webhook(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'No customer email' });
    });
});
