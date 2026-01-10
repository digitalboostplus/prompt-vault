const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

module.exports = async (req, res) => {
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { token } = req.query;

    if (!token) {
        return res.status(400).json({ error: 'Missing download token' });
    }

    try {
        // Decode and verify token
        const decoded = Buffer.from(token, 'base64url').toString('utf8');
        const [sessionId, expires, signature] = decoded.split(':');

        // Verify signature
        const data = `${sessionId}:${expires}`;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.DOWNLOAD_SECRET || 'default-secret')
            .update(data)
            .digest('hex');

        if (signature !== expectedSignature) {
            return res.status(403).json({ error: 'Invalid download token' });
        }

        // Check expiration
        if (Date.now() > parseInt(expires)) {
            return res.status(410).json({ error: 'Download link has expired' });
        }

        // Serve the file
        const filePath = path.join(process.cwd(), 'downloads', 'prompt-vault.zip');

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            console.error('Download file not found:', filePath);
            return res.status(500).json({ error: 'Download file not found' });
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
};
