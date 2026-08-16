# BaaS Playwright E2E Architecture & Design

## Architecture Overview
The E2E test suite validates the integration of the React Frontend (`apps/web`), NestJS Backend (`apps/api`), and Gateway HTTP API (`https://api.branchpay.com.br/api`).

```
Playwright Runner
  ├── Browser Page (Chromium / Mobile) ──> Web App (http://localhost:5173)
  ├── API Request Context ───────────────> NestJS BaaS API (http://localhost:3000)
  └── Webhook Simulator (HMAC-SHA256) ───> POST /api/webhooks
```

## Test Components & Structure

1. **Fixtures (`tests/e2e/fixtures/`)**:
   - `auth.fixture.ts`: Pre-authenticates merchants and provides auth headers/tokens.
   - `webhook.fixture.ts`: Computes `X-Lera-Box-Signature` using SHA-256 HMAC and dispatches gateway events.

2. **Page Objects (`tests/e2e/page-objects/`)**:
   - `LoginPage.ts`: Login and Register form operations and assertions.
   - `DashboardPage.ts`: Balance inspection, link creation modal, withdrawal modal, statement filters.
   - `CheckoutPage.ts`: Method selection (Pix / Card), payer inputs, QR code / EMV checks, card inputs, installment picker, status banners, print receipt.

3. **Specs (`tests/e2e/specs/`)**:
   - `01-auth-onboarding.spec.ts`
   - `02-checkout-link.spec.ts`
   - `03-payment-pix.spec.ts`
   - `04-payment-card.spec.ts`
   - `05-wallet-extract-filters.spec.ts`
   - `06-withdrawals.spec.ts`
   - `07-webhooks-idempotency.spec.ts`
   - `08-edge-cases-resilience.spec.ts`

## Configuration
- Support `playwright.config.ts` at root.
- Multi-project support: Desktop Chrome & Mobile Chrome.
- WebServer orchestration for local execution with graceful reuse in development.
