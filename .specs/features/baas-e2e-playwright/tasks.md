# BaaS Playwright E2E Tasks

## Execution Plan

### Phase 1: Environment & Config Setup
- [ ] T1: Install Playwright and setup `playwright.config.ts` and NPM scripts.

### Phase 2: Page Objects & Fixtures
- [ ] T2: Implement Page Objects (`LoginPage`, `DashboardPage`, `CheckoutPage`) and Helpers (HMAC signer, generators).

### Phase 3: Core E2E Specs
- [ ] T3: Implement Auth & Checkout Link specs (`01-auth-onboarding.spec.ts`, `02-checkout-link.spec.ts`).
- [ ] T4: Implement Payment specs (`03-payment-pix.spec.ts`, `04-payment-card.spec.ts`).
- [ ] T5: Implement Wallet & Statement specs (`05-wallet-extract-filters.spec.ts`, `06-withdrawals.spec.ts`).
- [ ] T6: Implement Webhooks, Idempotency & Edge Cases specs (`07-webhooks-idempotency.spec.ts`, `08-edge-cases-resilience.spec.ts`).

### Phase 4: Verification & Integration
- [ ] T7: Run and verify complete Playwright E2E suite.
