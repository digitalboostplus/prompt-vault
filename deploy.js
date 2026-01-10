#!/usr/bin/env node

/**
 * Prompt Vault Deployment Script
 *
 * This script handles the complete deployment of Prompt Vault:
 * 1. Installs dependencies
 * 2. Builds the downloadable ZIP
 * 3. Creates Stripe product and price
 * 4. Deploys to Vercel
 * 5. Configures Stripe webhook
 *
 * Usage: node deploy.js
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function ask(question) {
    return new Promise(resolve => {
        rl.question(question, resolve);
    });
}

function exec(command, options = {}) {
    try {
        return execSync(command, {
            encoding: 'utf8',
            stdio: options.silent ? 'pipe' : 'inherit',
            ...options
        });
    } catch (error) {
        if (!options.ignoreError) {
            throw error;
        }
        return null;
    }
}

function checkCommand(command) {
    try {
        execSync(`${command} --version`, { stdio: 'pipe' });
        return true;
    } catch {
        return false;
    }
}

async function main() {
    console.log('\n========================================');
    console.log('   PROMPT VAULT DEPLOYMENT');
    console.log('   500 Business Prompts - $14.99');
    console.log('========================================\n');

    // Check prerequisites
    console.log('Checking prerequisites...\n');

    const hasNode = checkCommand('node');
    const hasNpm = checkCommand('npm');
    const hasVercel = checkCommand('vercel');

    if (!hasNode || !hasNpm) {
        console.error('ERROR: Node.js and npm are required.');
        console.error('Install from: https://nodejs.org/');
        process.exit(1);
    }

    if (!hasVercel) {
        console.log('Vercel CLI not found. Installing...');
        exec('npm install -g vercel');
    }

    console.log('Prerequisites OK\n');

    // Check for .env file
    const envPath = path.join(__dirname, '.env');
    let envVars = {};

    if (fs.existsSync(envPath)) {
        console.log('Found existing .env file.');
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length) {
                envVars[key.trim()] = valueParts.join('=').trim();
            }
        });
    }

    // Collect API keys if not present
    console.log('\n--- API KEYS SETUP ---\n');
    console.log('You need accounts with these services (all have free tiers):');
    console.log('  - Stripe: https://stripe.com');
    console.log('  - Vercel: https://vercel.com');
    console.log('  - Resend: https://resend.com\n');

    if (!envVars.STRIPE_SECRET_KEY) {
        console.log('Get your Stripe Secret Key from: https://dashboard.stripe.com/apikeys');
        envVars.STRIPE_SECRET_KEY = await ask('Stripe Secret Key (sk_...): ');
    }

    if (!envVars.RESEND_API_KEY) {
        console.log('\nGet your Resend API Key from: https://resend.com/api-keys');
        envVars.RESEND_API_KEY = await ask('Resend API Key (re_...): ');
    }

    if (!envVars.FROM_EMAIL) {
        console.log('\nEmail address to send from (must be verified in Resend):');
        envVars.FROM_EMAIL = await ask('From Email: ');
    }

    // Generate download secret if not present
    if (!envVars.DOWNLOAD_SECRET) {
        envVars.DOWNLOAD_SECRET = require('crypto').randomBytes(32).toString('hex');
    }

    // Save .env file
    const envContent = Object.entries(envVars)
        .map(([k, v]) => `${k}=${v}`)
        .join('\n');
    fs.writeFileSync(envPath, envContent);
    console.log('\nSaved API keys to .env file\n');

    // Install dependencies
    console.log('--- INSTALLING DEPENDENCIES ---\n');
    exec('npm install');

    // Build ZIP file
    console.log('\n--- BUILDING DOWNLOAD PACKAGE ---\n');
    exec('node scripts/build-zip.js');

    // Create Stripe product and price
    console.log('\n--- CREATING STRIPE PRODUCT ---\n');

    if (!envVars.STRIPE_PRICE_ID) {
        const Stripe = require('stripe');
        const stripe = new Stripe(envVars.STRIPE_SECRET_KEY);

        try {
            // Create product
            const product = await stripe.products.create({
                name: 'Prompt Vault - 500 Business Prompts',
                description: '500 ready-to-use AI prompts for business professionals. Covers emails, meetings, reports, presentations, and more.',
                metadata: {
                    category: 'digital_product'
                }
            });

            console.log(`Created product: ${product.id}`);

            // Create price
            const price = await stripe.prices.create({
                product: product.id,
                unit_amount: 1499, // $14.99 in cents
                currency: 'usd',
            });

            console.log(`Created price: ${price.id}`);

            envVars.STRIPE_PRICE_ID = price.id;

            // Update .env
            const updatedEnv = Object.entries(envVars)
                .map(([k, v]) => `${k}=${v}`)
                .join('\n');
            fs.writeFileSync(envPath, updatedEnv);

        } catch (error) {
            console.error('Error creating Stripe product:', error.message);
            process.exit(1);
        }
    } else {
        console.log(`Using existing price: ${envVars.STRIPE_PRICE_ID}`);
    }

    // Deploy to Vercel
    console.log('\n--- DEPLOYING TO VERCEL ---\n');
    console.log('If prompted, follow the Vercel login instructions.\n');

    // Set up Vercel environment variables
    const vercelEnvVars = [
        ['STRIPE_SECRET_KEY', envVars.STRIPE_SECRET_KEY],
        ['STRIPE_PRICE_ID', envVars.STRIPE_PRICE_ID],
        ['RESEND_API_KEY', envVars.RESEND_API_KEY],
        ['FROM_EMAIL', envVars.FROM_EMAIL],
        ['DOWNLOAD_SECRET', envVars.DOWNLOAD_SECRET],
    ];

    // Deploy
    let deployUrl;
    try {
        // First deployment to get URL
        const deployOutput = exec('vercel --prod --yes', { silent: true });
        deployUrl = deployOutput.trim().split('\n').pop();
        console.log(`\nDeployed to: ${deployUrl}`);
    } catch (error) {
        console.log('\nVercel deployment requires login. Running interactive deploy...');
        exec('vercel --prod');

        // Get the deployment URL
        const projectInfo = exec('vercel inspect --json', { silent: true, ignoreError: true });
        if (projectInfo) {
            const info = JSON.parse(projectInfo);
            deployUrl = info.url;
        }
    }

    // Set environment variables in Vercel
    console.log('\nSetting environment variables in Vercel...');
    for (const [key, value] of vercelEnvVars) {
        try {
            exec(`vercel env add ${key} production`, {
                input: value,
                silent: true,
                ignoreError: true
            });
        } catch {
            // Might already exist
        }
    }

    // Create Stripe webhook
    console.log('\n--- CONFIGURING STRIPE WEBHOOK ---\n');

    if (!envVars.STRIPE_WEBHOOK_SECRET && deployUrl) {
        const Stripe = require('stripe');
        const stripe = new Stripe(envVars.STRIPE_SECRET_KEY);

        try {
            const webhookEndpoint = await stripe.webhookEndpoints.create({
                url: `${deployUrl}/api/webhook`,
                enabled_events: ['checkout.session.completed'],
            });

            envVars.STRIPE_WEBHOOK_SECRET = webhookEndpoint.secret;
            console.log('Created webhook endpoint');

            // Update .env and Vercel
            const finalEnv = Object.entries(envVars)
                .map(([k, v]) => `${k}=${v}`)
                .join('\n');
            fs.writeFileSync(envPath, finalEnv);

            exec(`vercel env add STRIPE_WEBHOOK_SECRET production`, {
                input: envVars.STRIPE_WEBHOOK_SECRET,
                silent: true,
                ignoreError: true
            });

            // Redeploy with webhook secret
            console.log('\nRedeploying with webhook configuration...');
            exec('vercel --prod --yes', { silent: true });

        } catch (error) {
            console.error('Error creating webhook:', error.message);
            console.log('\nYou may need to create the webhook manually:');
            console.log(`1. Go to: https://dashboard.stripe.com/webhooks`);
            console.log(`2. Add endpoint: ${deployUrl}/api/webhook`);
            console.log(`3. Select event: checkout.session.completed`);
            console.log(`4. Copy the signing secret and add to Vercel environment variables`);
        }
    }

    // Done!
    console.log('\n========================================');
    console.log('   DEPLOYMENT COMPLETE!');
    console.log('========================================\n');

    if (deployUrl) {
        console.log(`Your site is live at: ${deployUrl}\n`);
    }

    console.log('Next steps:');
    console.log('1. Visit your site and test the checkout flow');
    console.log('2. Use Stripe test mode first (test card: 4242 4242 4242 4242)');
    console.log('3. When ready, switch to live Stripe keys');
    console.log('4. Configure a custom domain in Vercel if desired\n');

    console.log('To redeploy after changes: vercel --prod');
    console.log('To view logs: vercel logs\n');

    rl.close();
}

main().catch(error => {
    console.error('Deployment failed:', error);
    rl.close();
    process.exit(1);
});
