module.exports = {
    generateDownloadEmail: (downloadUrl) => `
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
    `
};
