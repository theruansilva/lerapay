# BaaS Playwright E2E Testing Specification

## Problem Statement
The BaaS platform integrates critical financial flows (Auth, Checkout links, Pix QR/EMV, Credit Card installment fee calculation, Statement filtering, Withdrawals, Webhook signatures & idempotency). To guarantee end-to-end correctness across the NestJS API, React/Vite UI, and Gateway HTTP contracts, an automated Playwright E2E suite is required.

## Goals
- [ ] Automated end-to-end testing of Merchant Authentication, Login, and Gateway Credential Linking.
- [ ] Automated testing of Checkout Link creation, Slug generation, and Public Checkout rendering.
- [ ] Automated testing of Pix payment lifecycle (Form validation, QR Code SVG rendering, Copy EMV, Webhook simulation, Status transition to APPROVED, and Printable Receipt).
- [ ] Automated testing of Credit Card payment lifecycle (BIN brand detection, 1x to 21x fee calculation, Luhn validation, submission, and result states).
- [ ] Automated testing of Wallet statement, balance sync, and multi-criteria filters (APPROVED, DENIED, EXPIRED, CANCELLED).
- [ ] Automated testing of Pix Withdrawals (Key format validation, balance limit checks, and status tracking).
- [ ] Automated testing of Webhook ingestion, HMAC `X-Lera-Box-Signature` verification, and multi-delivery idempotency.
- [ ] Configurable Playwright test runner with parallelization, mock/sandbox fallback, and HTML reports.

## Out of Scope
| Feature | Reason |
| --- | --- |
| Real bank clearing execution | Delegated to simulated gateway API / sandbox |
| Hardware POS terminal tests | Web and HTTP API scope only |

---

## User Stories & Acceptance Criteria

### US-1: Merchant Onboarding & Dashboard Access
- System SHALL allow registration and login of merchants in the BaaS portal.
- System SHALL display current wallet balance formatted in BRL.
- System SHALL provide interface to link Gateway credentials safely.

### US-2: Payment Link Generation & Public Checkout
- Merchant SHALL create checkout links specifying title and amount in BRL (stored in cents).
- Buyer SHALL access the link by unique slug and view accurate amount and merchant information.

### US-3: Pix Checkout & Real-Time Settlement
- Buyer SHALL fill payer details and generate Pix payload.
- System SHALL render QR Code SVG and Copyable EMV.
- System SHALL update order status reactively upon receiving payment webhook or polling.

### US-4: Card Payment & Dynamic Fee Calculation
- System SHALL query fee schedule (1x to 21x) and display installment plans with exact fee percentages.
- Buyer SHALL enter card data with Luhn and date validations.

### US-5: Webhook Signature & Idempotent Processing
- System SHALL reject invalid HMAC signatures with 401/403.
- System SHALL process repeated identical webhooks idempotently without duplicate balance additions.
