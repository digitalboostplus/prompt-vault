const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

function encrypt(text, password) {
    const salt = crypto.randomBytes(16);
    const key = crypto.scryptSync(password, salt, 32);
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return salt.toString('hex') + ':' + iv.toString('hex') + ':' + encrypted;
}

function decrypt(text, password) {
    const textParts = text.split(':');
    const salt = Buffer.from(textParts.shift(), 'hex');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const key = crypto.scryptSync(password, salt, 32);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

const command = process.argv[2];
const password = process.env.ENV_ENCRYPTION_KEY;

if (!password) {
    console.error('ENV_ENCRYPTION_KEY is not set');
    process.exit(1);
}

if (command === 'encrypt') {
    const inputPath = path.join(process.cwd(), '.env');
    const outputPath = path.join(process.cwd(), '.env.enc');
    if (!fs.existsSync(inputPath)) {
        console.error('.env file not found');
        process.exit(1);
    }
    const content = fs.readFileSync(inputPath, 'utf8');
    const encrypted = encrypt(content, password);
    fs.writeFileSync(outputPath, encrypted);
    console.log('.env.enc created');
} else if (command === 'decrypt') {
    const inputPath = path.join(process.cwd(), '.env.enc');
    const outputPath = path.join(process.cwd(), '.env');
    if (!fs.existsSync(inputPath)) {
        console.error('.env.enc file not found');
        process.exit(1);
    }
    const content = fs.readFileSync(inputPath, 'utf8');
    const decrypted = decrypt(content, password);
    fs.writeFileSync(outputPath, decrypted);
    console.log('.env created');
} else {
    console.error('Usage: node scripts/secrets.js [encrypt|decrypt]');
    process.exit(1);
}
