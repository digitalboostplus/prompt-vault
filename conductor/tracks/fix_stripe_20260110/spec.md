# Track Specification: Fix Stripe Payment Integration

## Overview
The "Buy Now" checkout flow is currently failing, preventing users from purchasing the product. This track focuses on diagnosing the root cause—likely missing configuration or incorrect API usage—and implementing a robust fix.

## Core Requirements

### 1. Configuration Validation
*   **Fail Fast:** The `create-checkout.js` endpoint must check for the presence of `STRIPE_SECRET_KEY` and `STRIPE_PRICE_ID` immediately.
*   **Clear Errors:** If configuration is missing, the API must return a clear 500 error message (e.g., "Server Misconfiguration: Missing Stripe Keys") to aid debugging (at least in dev mode).

### 2. URL Handling
*   **Protocol Detection:** The `success_url` and `cancel_url` must correctly use `http://` for localhost and `https://` for production to avoid Stripe validation errors.

### 3. Frontend Error Handling
*   **User Feedback:** The frontend script must catch non-200 responses from the API and display the error message to the user (or log it to the console) instead of failing silently or generically.

## Success Criteria
*   Clicking "Buy Now" successfully redirects to a hosted Stripe Checkout page.
*   The Checkout page displays the correct product ("Prompt Vault") and price ($14.99).
*   After payment, the user is redirected back to the local or production `success.html` page.
