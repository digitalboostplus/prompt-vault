const download = require('./download');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

jest.mock('fs');

describe('download API', () => {
    let req, res, mockReadStream;

    beforeEach(() => {
        req = {
            method: 'GET',
            query: {}
        };
        res = {
            setHeader: jest.fn(),
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        
        mockReadStream = {
            pipe: jest.fn()
        };
        
        fs.createReadStream.mockReturnValue(mockReadStream);
        fs.existsSync.mockReturnValue(true);
        fs.statSync.mockReturnValue({ size: 1024 });
        
        process.env.DOWNLOAD_SECRET = 'test_secret';
    });

    // Helper to generate valid token
    function generateToken(sessionId, expiryOffset = 3600000) {
        const expires = Date.now() + expiryOffset;
        const data = `${sessionId}:${expires}`;
        const signature = crypto
            .createHmac('sha256', process.env.DOWNLOAD_SECRET)
            .update(data)
            .digest('hex');
        return Buffer.from(`${data}:${signature}`).toString('base64url');
    }

    it('should reject non-GET requests', async () => {
        req.method = 'POST';
        await download(req, res);
        expect(res.status).toHaveBeenCalledWith(405);
    });

    it('should require a token', async () => {
        await download(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should reject invalid signature', async () => {
        const token = Buffer.from('sess:123:badsig').toString('base64url');
        req.query.token = token;
        await download(req, res);
        expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should reject expired token', async () => {
        req.query.token = generateToken('sess_123', -10000); // Expired
        await download(req, res);
        expect(res.status).toHaveBeenCalledWith(410);
    });

    it('should serve file for valid token', async () => {
        req.query.token = generateToken('sess_123');
        await download(req, res);
        
        expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/zip');
        expect(fs.createReadStream).toHaveBeenCalledWith(expect.stringContaining('prompt-vault.zip'));
        expect(mockReadStream.pipe).toHaveBeenCalledWith(res);
    });

    it('should handle missing file', async () => {
        req.query.token = generateToken('sess_123');
        fs.existsSync.mockReturnValue(false);
        
        await download(req, res);
        
        expect(res.status).toHaveBeenCalledWith(500);
    });
});
