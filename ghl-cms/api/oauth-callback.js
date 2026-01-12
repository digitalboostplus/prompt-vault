/**
 * GHL OAuth Callback Handler
 * Handles OAuth 2.0 callback from Go High Level
 */

const { oauthService } = require('../services/oauth');

/**
 * Handle OAuth callback
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
async function handleOAuthCallback(req, res) {
  try {
    const { code, state, error, error_description } = req.query;

    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', error, error_description);
      return res.redirect(`/admin?error=${encodeURIComponent(error_description || error)}`);
    }

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Authorization code is required'
      });
    }

    // Verify state parameter (CSRF protection)
    const storedState = req.cookies?.oauth_state;
    if (storedState && storedState !== state) {
      console.error('OAuth state mismatch');
      return res.redirect('/admin?error=invalid_state');
    }

    // Exchange code for tokens
    const tokens = await oauthService.exchangeCodeForToken(code);

    console.log('OAuth tokens received:', {
      locationId: tokens.locationId,
      expiresIn: tokens.expires_in,
      scope: tokens.scope
    });

    // Clear state cookie and set success indicator
    res.setHeader('Set-Cookie', [
      'oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0',
      `ghl_connected=true; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}` // 7 days
    ]);

    // Redirect to admin dashboard
    return res.redirect('/admin?connected=true');
  } catch (error) {
    console.error('OAuth callback error:', error);
    return res.redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  }
}

/**
 * Initiate OAuth flow
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
async function initiateOAuth(req, res) {
  try {
    // Generate random state for CSRF protection
    const state = crypto.randomBytes(32).toString('hex');

    // Store state in cookie
    res.setHeader('Set-Cookie', [
      `oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 10}` // 10 minutes
    ]);

    // Get authorization URL
    const authUrl = oauthService.getAuthorizationUrl(state);

    // Redirect to GHL OAuth
    return res.redirect(authUrl);
  } catch (error) {
    console.error('OAuth initiation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to initiate OAuth flow'
    });
  }
}

/**
 * Disconnect GHL
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
async function disconnectGHL(req, res) {
  try {
    await oauthService.revokeTokens();

    res.setHeader('Set-Cookie', [
      'ghl_connected=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
    ]);

    return res.json({
      success: true,
      message: 'Disconnected from Go High Level'
    });
  } catch (error) {
    console.error('Disconnect error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to disconnect'
    });
  }
}

const crypto = require('crypto');

module.exports = {
  handleOAuthCallback,
  initiateOAuth,
  disconnectGHL
};
