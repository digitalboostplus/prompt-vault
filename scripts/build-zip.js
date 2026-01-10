/**
 * Build script to create the downloadable ZIP file
 * Run with: node scripts/build-zip.js
 */

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const PROMPTS_DIR = path.join(__dirname, '..', 'prompts');
const DOWNLOADS_DIR = path.join(__dirname, '..', 'downloads');
const OUTPUT_FILE = path.join(DOWNLOADS_DIR, 'prompt-vault.zip');

async function buildZip() {
    console.log('Building Prompt Vault ZIP file...\n');

    // Ensure downloads directory exists
    if (!fs.existsSync(DOWNLOADS_DIR)) {
        fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
    }

    // Remove existing ZIP if present
    if (fs.existsSync(OUTPUT_FILE)) {
        fs.unlinkSync(OUTPUT_FILE);
    }

    // Create write stream and archiver
    const output = fs.createWriteStream(OUTPUT_FILE);
    const archive = archiver('zip', { zlib: { level: 9 } });

    // Handle events
    output.on('close', () => {
        const sizeMB = (archive.pointer() / 1024 / 1024).toFixed(2);
        console.log(`\nZIP file created: ${OUTPUT_FILE}`);
        console.log(`Size: ${sizeMB} MB`);
    });

    archive.on('warning', (err) => {
        if (err.code !== 'ENOENT') {
            throw err;
        }
    });

    archive.on('error', (err) => {
        throw err;
    });

    // Pipe archive to file
    archive.pipe(output);

    // Add prompt files
    const promptFiles = fs.readdirSync(PROMPTS_DIR)
        .filter(f => f.endsWith('.md'))
        .sort();

    console.log('Adding prompt files:');
    for (const file of promptFiles) {
        const filePath = path.join(PROMPTS_DIR, file);
        archive.file(filePath, { name: `prompts/${file}` });
        console.log(`  - ${file}`);
    }

    // Create and add README
    const readme = `# Prompt Vault - 500 Business Prompts

Thank you for purchasing Prompt Vault!

## What's Included

This pack contains 500 AI prompts organized into 10 categories:

1. **Email Communication** (50 prompts)
   Cold outreach, follow-ups, difficult conversations, internal updates

2. **Meeting Management** (50 prompts)
   Agendas, summaries, facilitation, virtual meeting best practices

3. **Report Writing** (50 prompts)
   Executive summaries, status reports, data analysis, documentation

4. **Presentation Creation** (50 prompts)
   Pitch decks, training materials, quarterly reviews, slide content

5. **Strategy & Planning** (50 prompts)
   SWOT analysis, OKRs, business planning, competitive analysis

6. **Project Management** (50 prompts)
   Status updates, risk assessment, stakeholder communication

7. **Client Communication** (50 prompts)
   Proposals, difficult conversations, relationship building

8. **Performance & HR** (50 prompts)
   Reviews, feedback, hiring, onboarding, team management

9. **Business Analysis** (50 prompts)
   Market research, financial analysis, competitive intelligence

10. **Negotiation & Sales** (50 prompts)
    Discovery calls, objection handling, closing techniques

## How to Use

1. Open any prompt file in this pack
2. Find a prompt that matches your need
3. Copy the prompt text
4. Replace the [bracketed text] with your specific details
5. Paste into ChatGPT, Claude, or your AI assistant of choice

## Tips for Best Results

- Be specific when filling in the brackets
- Provide context about your industry/situation
- Review and refine the AI's output
- Save prompts you use often for quick access

## Support

Questions? Reply to your purchase confirmation email.

---
Prompt Vault | promptvault.com
`;

    archive.append(readme, { name: 'README.md' });
    console.log('\nAdded README.md');

    // Finalize
    await archive.finalize();
}

buildZip().catch(console.error);
