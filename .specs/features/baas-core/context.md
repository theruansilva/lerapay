# BaaS Core Context

**Gathered:** 2026-08-14
**Spec:** `.specs/features/baas-core/spec.md`
**Status:** Ready for design

---

## Feature Boundary

Deliver a complete Banking as a Service (BaaS) platform integrating with the Lera Box (BranchPay) simulated payment gateway. The platform consists of a NestJS backend (TypeORM + MySQL + Swagger) and a React/Vite dashboard + checkout frontend, supporting Pix and credit card payments, merchant wallets, statements, withdrawals, fee management, and webhook handling.

---

## Implementation Decisions

### 1. Workspace & Project Structure
- Monorepo with **NPM Workspaces**:
  - `apps/api`: NestJS application, TypeORM entities, validation, Swagger, gateway client.
  - `apps/web`: React + Vite + Tailwind CSS / Lucide icons (merchant portal + public checkout page).
  - `docker-compose.yml`: Multi-container setup (MySQL 8, API, Web).

### 2. Gateway Integration & Environment Configuration
- Dedicated HTTP Gateway client module pointing to `https://api.branchpay.com.br/api`.
- Supports credentials via `.env` (`GATEWAY_EMAIL`, `GATEWAY_PASSWORD`, `GATEWAY_CLIENT_CODE`, `GATEWAY_STORE_KEY`) or via onboarding endpoints.
- Auto-renews JWT Bearer token on expiry.
- Frontend strictly interacts with `apps/api`; gateway credentials and tokens never touch the client.

### 3. Financial Integrity & Units
- All amounts in integers (centavos: `1000` = R$ 10,00).
- Fees calculated against the gateway's `/api/fees` table with exact installment percentages.
- Database ledger tracks `orders`, `transactions`, `withdrawals`, and `checkout_links` with status state machines.

### 4. Webhooks & Idempotency
- Endpoints for `PAYMENT_PIX`, `PAYMENT_CARD`, and `WITHDRAWAL` callbacks.
- Signature verification (`X-Lera-Box-Signature`).
- Idempotent handler checking `webhook_events` table before updating orders or balances.

### 5. Merchant Dashboard & Public Checkout UX
- **Merchant Portal**:
  - Wallet balance display & statement with status filters (`APPROVED`, `DENIED`, `EXPIRED`, `CANCELLED`).
  - Checkout link generator (amount, title, allowed payment methods, installments).
  - Withdrawal request form & status tracking.
  - Webhook URL management & test triggers.
- **Public Checkout**:
  - Responsive payment page with Pix QR Code + Copy & Paste EMV string and Credit Card form (with dynamic fee calculation per installment).
  - Real-time status polling / confirmation screen with printable receipt.

---

## Specific References
- Gateway API: `https://api.branchpay.com.br/api`
- Gateway Swagger: `https://api.branchpay.com.br/doscs`
- PDF: `desafio-tecnico-baas-integracao-gateway-vba-systems.pdf`
