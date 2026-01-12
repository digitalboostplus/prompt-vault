/**
 * Go High Level OAuth Service
 * Handles OAuth 2.0 authentication flow with GHL
 *
 * API Docs: https://marketplace.gohighlevel.com/docs/
 */

const { GHL_CONFIG } = require('../config/ghl-config');

class GHLOAuthService {
  constructor() {
    this.clientId = GHL_CONFIG.oauth.clientId;
    this.clientSecret = GHL_CONFIG.oauth.clientSecret;
    this.redirectUri = GHL_CONFIG.oauth.redirectUri;
    this.scopes = GHL_CONFIG.oauth.scopes;
    this.tokenStore = new Map(); // In production, use persistent storage
  }

  /**
   * Generate OAuth authorization URL
   * @param {string} state - State parameter for CSRF protection
   */
  getAuthorizationUrl(state) {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: this.scopes.join(' '),
      state: state
    });

    return `https://marketplace.gohighlevel.com/oauth/chooselocation?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   * @param {string} code - Authorization code from callback
   */
  async exchangeCodeForToken(code) {
    const response = await fetch('https://services.leadconnectorhq.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: this.redirectUri
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OAuth token exchange failed: ${error.error_description || error.error}`);
    }

    const tokenData = await response.json();

    // Store tokens
    this.storeTokens(tokenData);

    return tokenData;
  }

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken - Refresh token
   */
  async refreshAccessToken(refreshToken) {
    const response = await fetch('https://services.leadconnectorhq.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Token refresh failed: ${error.error_description || error.error}`);
    }

    const tokenData = await response.json();

    // Update stored tokens
    this.storeTokens(tokenData);

    return tokenData;
  }

  /**
   * Store tokens (in production, use secure persistent storage)
   * @param {Object} tokenData - Token response from OAuth
   */
  storeTokens(tokenData) {
    const locationId = tokenData.locationId || GHL_CONFIG.locationId;

    this.tokenStore.set(locationId, {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: Date.now() + (tokenData.expires_in * 1000),
      tokenType: tokenData.token_type,
      scope: tokenData.scope
    });
  }

  /**
   * Get valid access token (refreshes if expired)
   * @param {string} locationId - GHL Location ID
   */
  async getValidAccessToken(locationId = GHL_CONFIG.locationId) {
    const tokens = this.tokenStore.get(locationId);

    if (!tokens) {
      throw new Error('No tokens found. Please authenticate first.');
    }

    // Check if token is expired (with 5 minute buffer)
    if (Date.now() >= tokens.expiresAt - 300000) {
      const newTokens = await this.refreshAccessToken(tokens.refreshToken);
      return newTokens.access_token;
    }

    return tokens.accessToken;
  }

  /**
   * Revoke tokens
   * @param {string} locationId - GHL Location ID
   */
  async revokeTokens(locationId = GHL_CONFIG.locationId) {
    this.tokenStore.delete(locationId);
  }

  /**
   * Check if authenticated
   * @param {string} locationId - GHL Location ID
   */
  isAuthenticated(locationId = GHL_CONFIG.locationId) {
    return this.tokenStore.has(locationId);
  }
}

// Singleton instance
const oauthService = new GHLOAuthService();

module.exports = { GHLOAuthService, oauthService };
