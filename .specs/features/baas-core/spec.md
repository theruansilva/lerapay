# BaaS Core Feature Specification

## Problem Statement

Merchants need a Banking as a Service (BaaS) platform to generate payment checkout links (Pix and Credit Card), track balances, issue withdrawals, and automatically reconcile asynchronous transaction updates from the Lera Box (BranchPay) gateway. This solution provides a reliable, secure backend with a merchant portal and public checkout interface.

## Goals

- [ ] Provide end-to-end checkout processing for Pix (QR/EMV) and Credit Card (dynamic fee calculation per installment).
- [ ] Provide merchant balance, filtered statement, and withdrawal execution connected to the gateway.
- [ ] Provide resilient webhook ingestion with signature verification and database idempotency.
- [ ] Deliver full Swagger OpenAPI documentation and Docker Compose multi-service deployment.

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
| --- | --- |
| Direct database access to gateway | Prohibited by specification; all operations must use HTTP APIs |
| Production KYC document upload / OCR | Gateway handles sandbox registration directly |
| Real banking clearing (TED/PIX BACEN direct) | Delegated exclusively to the simulated gateway |

---

## Assumptions & Open Questions

Every ambiguity is resolved or recorded here - nothing is left silently unclear.

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Gateway credentials | Load from environment variables (`GATEWAY_EMAIL`, `GATEWAY_PASSWORD`, `GATEWAY_CLIENT_CODE`, `GATEWAY_STORE_KEY`) or config | Enables smooth local development, CI testing and demo evaluation | Yes |
| Monetary amounts | Integer in cents (`centavos`) throughout database and APIs | Prevents floating point rounding errors in financial transactions | Yes |
| Monorepo architecture | NPM workspaces (`apps/api` and `apps/web`) | Keeps backend and frontend co-located with unified scripts and Docker setup | Yes |
| Webhook idempotency | Deduplication based on gateway transaction ID and internal order reference in MySQL | Ensures ledger consistency across network retries | Yes |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Core Gateway Integration & Authentication ⭐ MVP

**User Story**: As the BaaS platform, I want to authenticate against the Lera Box gateway using configured merchant credentials so that all downstream banking operations are securely authorized.

**Why P1**: Foundation required for all subsequent payments, balances, and payouts.

**Acceptance Criteria**:

1. The system SHALL store and manage gateway JWT tokens securely in memory/cache and refresh them upon expiration.
2. The system SHALL NEVER expose gateway passwords or secret keys to the frontend client.
3. WHEN the BaaS API initializes THEN the system SHALL verify connection with the gateway `GET /api/users/me` or authenticate via `POST /api/auth/login`.
4. IF gateway authentication fails THEN the system SHALL log the error and reject unauthorized operational requests with status code 502 or 401.

**Independent Test**: Can verify gateway authentication by calling health/gateway status endpoint and receiving active connection details.

---

### P2: Checkout Link Creation & Payment Processing ⭐ MVP

**User Story**: As a merchant, I want to create a checkout link with a specific amount and title so that my customers can pay via Pix or Credit Card.

**Why P2**: Primary revenue-generating flow of the BaaS product.

**Acceptance Criteria**:

1. WHEN a merchant requests link creation with an amount in cents and title THEN the system SHALL persist a `checkout_link` record with a unique slug/ID and status `PENDING`.
2. WHEN a customer requests Pix payment on a checkout link THEN the system SHALL call gateway `POST /api/payments/pix` and return `qrCodeBase64` and EMV string.
3. WHEN a customer requests Credit Card payment THEN the system SHALL validate card payload, query `GET /api/fees`, verify `feePercent` matches the selected installment rate, and call gateway `POST /api/payments/card`.
4. All payment requests to the gateway SHALL include an `externalReference` correlating to the internal BaaS order ID.
5. IF payment amount is invalid or zero THEN the system SHALL return 400 Bad Request with validation errors.

**Independent Test**: Can create a link via API/UI, open public checkout, generate Pix QR or simulate Card payment, and verify order creation.

---

### P3: Asynchronous Webhook Ingestion & Idempotency ⭐ MVP

**User Story**: As a system operator, I want incoming gateway webhook events to update order and balance records reliably without double-processing.

**Why P3**: Essential for asynchronous payment confirmation (Pix & Card) and withdrawal reconciliation.

**Acceptance Criteria**:

1. WHEN a webhook payload is received on `/api/webhooks` THEN the system SHALL persist the raw payload in `webhook_events`.
2. WHERE `X-Lera-Box-Signature` header is present THEN the system SHALL validate the HMAC signature against configured webhook secret.
3. WHEN a `PAYMENT_PIX` or `PAYMENT_CARD` webhook with status `APPROVED` is processed THEN the system SHALL update the associated order status to `APPROVED` and checkout link status to `PAID`.
4. IF a duplicate webhook event is received THEN the system SHALL acknowledge with 200 OK without reapplying balance or order transitions.

**Independent Test**: Can post simulated webhook payloads and verify order transitions and idempotent deduplication.

---

### P4: Wallet Balance, Statement & Withdrawals ⭐ MVP

**User Story**: As a merchant, I want to check my available balance, view filtered transaction statements, and request withdrawals to another Pix key.

**Why P4**: Completes the BaaS lifecycle by allowing merchants to view funds and cash out.

**Acceptance Criteria**:

1. WHEN a merchant requests wallet balance THEN the system SHALL query gateway `GET /api/wallet` and return balance in centavos and formatted BRL.
2. WHEN a merchant queries statement with status filters (`APPROVED`, `DENIED`, `EXPIRED`, `CANCELLED`) THEN the system SHALL return matching transactions.
3. WHEN a merchant requests a withdrawal with Pix key and amount in cents THEN the system SHALL call gateway `POST /api/withdrawals` and save the withdrawal record.
4. WHEN a merchant queries withdrawal status THEN the system SHALL call gateway `GET /api/withdrawals/:id`.

**Independent Test**: Can query balance, list transactions with filters, and submit a withdrawal request.

---

## Edge Cases

- IF the gateway returns a timeout or 500 error THEN the system SHALL preserve internal state in `PENDING` and allow reconciliation via status polling or webhook.
- IF card payment submission contains a mismatched `feePercent` THEN the system SHALL reject the request before gateway forwarding.
- IF a checkout link expires THEN the system SHALL return `EXPIRED` status on checkout load and block payment attempts.

---

## Requirement Traceability

Each requirement gets a unique ID for tracking across design, tasks, and validation.

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| AUTH-01 | P1: Core Gateway Integration & Authentication | Design | Pending |
| AUTH-02 | P1: Core Gateway Integration & Authentication | Design | Pending |
| PAY-01 | P2: Checkout Link Creation & Payment Processing | Design | Pending |
| PAY-02 | P2: Checkout Link Creation & Payment Processing | Design | Pending |
| PAY-03 | P2: Checkout Link Creation & Payment Processing | Design | Pending |
| HOOK-01 | P3: Asynchronous Webhook Ingestion & Idempotency | Design | Pending |
| HOOK-02 | P3: Asynchronous Webhook Ingestion & Idempotency | Design | Pending |
| WALLET-01 | P4: Wallet Balance, Statement & Withdrawals | Design | Pending |
| WALLET-02 | P4: Wallet Balance, Statement & Withdrawals | Design | Pending |

**Coverage:** 9 total, 9 mapped to design, 0 unmapped.

---

## Success Criteria

- [ ] Complete NestJS API with TypeORM + MySQL running in Docker Compose with Swagger at `/api/docs`.
- [ ] Complete React / Vite Merchant Dashboard and Public Checkout interface.
- [ ] End-to-end integration with Lera Box gateway for Pix, Card, Fees, Wallet, and Withdrawals.
- [ ] Automated tests passing for DTO validations, fee verification, webhook idempotency, and gateway adapter.
