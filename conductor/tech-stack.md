# Technology Stack

This document outlines the core technologies and services used in the Prompt Vault project.

## Core Runtime & Frameworks
*   **Node.js (>=18.0.0):** The primary runtime for both the backend functions and build scripts.
*   **Express.js:** Used within Firebase Functions to handle HTTP routing for webhooks and API endpoints.

## Backend & Infrastructure
*   **Firebase Cloud Functions (v2):** Provides the serverless backend for handling business logic, payments, and integrations.
*   **Firebase Hosting (Admin/Metadata):** Used for configuration and potentially storing site-related metadata.

## Frontend
*   **Static HTML/CSS/JavaScript:** The landing page and dashboard are built using standard web technologies to ensure maximum performance, SEO, and simplicity.
*   **Vercel:** The primary platform for hosting and deploying the static frontend.

## Third-Party Services
*   **Stripe:** Handles all payment processing, checkout sessions, and subscription/one-time purchase webhooks.
*   **Resend:** The delivery service used to send transactional emails and the final product (PDF/Dashboard links) to customers.

## Development & Build Tools
*   **Archiver:** A Node.js library used to programmatically generate the ZIP files for prompt delivery.
*   **Dotenv:** Manages environment variables for local development and deployment.
*   **Jest:** Used for unit testing the backend API endpoints.
*   **Gemini CLI / Conductor:** Used for project management, task automation, and codebase maintenance.
