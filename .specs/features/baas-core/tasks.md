# BaaS Core Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.**
Commits MUST follow Gitmoji + Conventional Commits per `AGENTS.md` and be strictly atomic per task.

---

**Design**: `.specs/features/baas-core/design.md`
**Status**: In Progress

---

## Test Coverage Matrix

> Generated from codebase guidelines (`AGENTS.md`, NestJS and Vitest standards).

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| Services & Gateway Client | unit | 100% of methods, fee calculation, gateway error handling | `apps/api/src/**/*.spec.ts` | `npm run test --workspace=apps/api` |
| Webhook & Payment Flow | integration | Idempotency, HMAC verification, state transitions | `apps/api/test/**/*.spec.ts` | `npm run test --workspace=apps/api` |
| Controllers & DTOs | unit / e2e | Validation pipes, error codes (400, 401, 502) | `apps/api/src/**/*.spec.ts` | `npm run test --workspace=apps/api` |
| UI Components & Pages | unit / build | Render integrity, form submission, fee calculation | `apps/web/src/**/*.test.tsx` | `npm run build --workspace=apps/web` |
| Configuration / Entities | none | Build gate only | - | `npm run build --workspace=apps/api` |

## Gate Check Commands

| Gate Level | When to Use | Command |
| --- | --- | --- |
| Quick | After tasks with unit tests | `npm run test --workspace=apps/api` |
| Full | After tasks with integration tests | `npm run test --workspace=apps/api` |
| Build | After phase completion or config-only tasks | `npm run build` |

---

## Execution Plan

Phases run sequentially in order.

### Phase 1: Workspace & Backend Infrastructure
```
T1 → T2 → T3 → T4
```

### Phase 2: Gateway Client & Fee Management
```
T5 → T6 → T7
```

### Phase 3: Checkout Links, Orders & Payment Processing
```
T8 → T9 → T10
```

### Phase 4: Webhooks & Idempotency Engine
```
T11 → T12
```

### Phase 5: Wallet, Statements & Withdrawals
```
T13 → T14
```

### Phase 6: Frontend - Merchant Portal & Public Checkout
```
T15 → T16 → T17
```

### Phase 7: Docker Compose & End-to-End Verification
```
T18 → T19
```

---

## Task Breakdown

### Phase 1: Workspace & Backend Infrastructure

#### T1: Setup Monorepo Workspace & Root Configs
**What**: Initialize npm monorepo workspaces for `apps/api` and `apps/web` with root scripts.
**Where**: `package.json`
**Depends on**: None
**Requirement**: AUTH-01
**Done when**:
- [ ] Root `package.json` configures workspaces `["apps/*"]`.
- [ ] Base build and test scripts are executable across workspaces.
- [ ] Build gate passes: `npm run build`
**Tests**: none
**Gate**: build
**Commit**: `🎉 chore(monorepo): initialize npm workspace for api and web`

---

#### T2: Scaffold NestJS Backend with Swagger & Validation
**What**: Setup `apps/api` with NestJS, TypeScript, `@nestjs/swagger`, `class-validator`, and correlation-id middleware.
**Where**: `apps/api/src/main.ts`
**Depends on**: T1
**Requirement**: AUTH-01
**Done when**:
- [ ] NestJS bootstrap configured with ValidationPipe and Swagger at `/api/docs`.
- [ ] Correlation ID middleware injects `X-Correlation-Id`.
- [ ] Build gate passes: `npm run build --workspace=apps/api`
**Tests**: none
**Gate**: build
**Commit**: `✨ feat(api): scaffold nestjs with swagger validation and correlation middleware`

---

#### T3: Setup TypeORM & MySQL Entity Models
**What**: Configure TypeORM database module and create entities for `User`, `CheckoutLink`, `Order`, `Withdrawal`, `WebhookEvent`.
**Where**: `apps/api/src/database/entities.ts`
**Depends on**: T2
**Requirement**: AUTH-01
**Done when**:
- [ ] Entities defined with proper types, centavos monetary fields, and relations.
- [ ] Database module configured with environment-based MySQL connection.
- [ ] Quick gate passes: `npm run test --workspace=apps/api`
**Tests**: unit
**Gate**: quick
**Commit**: `📦 feat(database): define typeorm entities and database configuration`

---

#### T4: Implement Merchant Auth & JWT Protection
**What**: Create user registration, login, and JWT AuthGuard for merchant endpoints.
**Where**: `apps/api/src/modules/auth/auth.service.ts`
**Depends on**: T3
**Requirement**: AUTH-01, AUTH-02
**Done when**:
- [ ] Password hashing with bcrypt and JWT token generation.
- [ ] Unit tests for AuthService and JwtAuthGuard pass.
- [ ] Quick gate passes: `npm run test --workspace=apps/api`
**Tests**: unit
**Gate**: quick
**Commit**: `🔒 feat(auth): implement merchant authentication and jwt guard`

---

### Phase 2: Gateway Client & Fee Management

#### T5: Implement Lera Box Gateway HTTP Adapter & Token Manager
**What**: Create `LeraBoxGatewayClient` to handle Bearer authentication, auto-reauth, and HTTP calls to `api.branchpay.com.br/api`.
**Where**: `apps/api/src/modules/gateway/gateway.client.ts`
**Depends on**: T4
**Requirement**: AUTH-01, AUTH-02
**Done when**:
- [ ] Authenticates with configured credentials and caches JWT token.
- [ ] Unit tests verify token caching, header injection, and 401 recovery.
- [ ] Quick gate passes: `npm run test --workspace=apps/api`
**Tests**: unit
**Gate**: quick
**Commit**: `🌐 feat(gateway): implement lerabox gateway client and token manager`

---

#### T6: Implement Fee Table Sync & Validation Service
**What**: Create FeeService to fetch gateway fees from `GET /api/fees` and validate installment percentages for card brands.
**Where**: `apps/api/src/modules/fees/fees.service.ts`
**Depends on**: T5
**Requirement**: PAY-03
**Done when**:
- [ ] Fetches and caches fees by brand (Visa, Master, Elo).
- [ ] Validates requested installment fee percent against gateway rates.
- [ ] Unit tests cover fee calculations and rejection of mismatched rates.
- [ ] Quick gate passes: `npm run test --workspace=apps/api`
**Tests**: unit
**Gate**: quick
**Commit**: `📊 feat(fees): implement fee query and installment validation service`

---

#### T7: Expose Gateway & Fees Public Controller
**What**: Expose `/api/fees` and `/api/gateway/status` endpoints for frontend fee calculation.
**Where**: `apps/api/src/modules/fees/fees.controller.ts`
**Depends on**: T6
**Requirement**: PAY-03
**Done when**:
- [ ] Endpoints documented with Swagger and returning installment tables.
- [ ] Quick gate passes: `npm run test --workspace=apps/api`
**Tests**: unit
**Gate**: quick
**Commit**: `✨ feat(fees): expose fees and gateway status controller endpoints`

---

### Phase 3: Checkout Links, Orders & Payment Processing

#### T8: Implement Checkout Link Management
**What**: Create service and endpoints for merchants to create, list, and view checkout links with unique slugs.
**Where**: `apps/api/src/modules/checkout/checkout-link.service.ts`
**Depends on**: T7
**Requirement**: PAY-01
**Done when**:
- [ ] Merchant can create link with amount in cents, title, and optional expiration.
- [ ] Unit tests verify link creation, unique slug generation, and amount validation.
- [ ] Quick gate passes: `npm run test --workspace=apps/api`
**Tests**: unit
**Gate**: quick
**Commit**: `🔗 feat(checkout): implement checkout link service and endpoints`

---

#### T9: Implement Pix Payment Flow
**What**: Process Pix checkout by creating order and calling gateway `POST /api/payments/pix` to obtain QR and EMV.
**Where**: `apps/api/src/modules/checkout/pix-payment.service.ts`
**Depends on**: T8
**Requirement**: PAY-02
**Done when**:
- [ ] Generates internal order and forwards request with `externalReference`.
- [ ] Stores and returns `qrCodeBase64`, EMV string, and txid.
- [ ] Unit tests verify Pix order generation and gateway payload mapping.
- [ ] Quick gate passes: `npm run test --workspace=apps/api`
**Tests**: unit
**Gate**: quick
**Commit**: `⚡ feat(checkout): implement pix payment processing and qr generation`

---

#### T10: Implement Credit Card Payment Flow
**What**: Process Credit Card checkout with fee validation and gateway `POST /api/payments/card`.
**Where**: `apps/api/src/modules/checkout/card-payment.service.ts`
**Depends on**: T9
**Requirement**: PAY-03
**Done when**:
- [ ] Validates card payload, enforces verified `feePercent`, and calls gateway.
- [ ] Stores order and external reference.
- [ ] Unit tests verify card charge submission, fee verification, and error handling.
- [ ] Quick gate passes: `npm run test --workspace=apps/api`
**Tests**: unit
**Gate**: quick
**Commit**: `💳 feat(checkout): implement credit card payment processing`

---

### Phase 4: Webhooks & Idempotency Engine

#### T11: Implement Inbound Webhook Receiver & Signature Verification
**What**: Create webhook controller on `/api/webhooks` with `X-Lera-Box-Signature` HMAC verification.
**Where**: `apps/api/src/modules/webhooks/webhooks.controller.ts`
**Depends on**: T10
**Requirement**: HOOK-01, HOOK-02
**Done when**:
- [ ] Validates webhook signature when secret is configured.
- [ ] Persists raw incoming payload to `webhook_events`.
- [ ] Unit tests verify signature checks (valid/invalid) and payload logging.
- [ ] Quick gate passes: `npm run test --workspace=apps/api`
**Tests**: unit
**Gate**: quick
**Commit**: `🛡️ feat(webhooks): implement webhook receiver and hmac signature verification`

---

#### T12: Implement Idempotent Event Processing & Order Reconciliation
**What**: Process `PAYMENT_PIX`, `PAYMENT_CARD`, and `WITHDRAWAL` webhook events with transactional idempotency.
**Where**: `apps/api/src/modules/webhooks/webhook-processor.service.ts`
**Depends on**: T11
**Requirement**: HOOK-01, HOOK-02
**Done when**:
- [ ] Updates order and link state based on webhook event status (`APPROVED`, `DENIED`, etc.).
- [ ] Discards duplicate events safely without duplicate side effects.
- [ ] Unit and integration tests verify idempotency and order status updates.
- [ ] Quick gate passes: `npm run test --workspace=apps/api`
**Tests**: integration
**Gate**: full
**Commit**: `🔄 feat(webhooks): implement idempotent webhook event processor`

---

### Phase 5: Wallet, Statements & Withdrawals

#### T13: Implement Wallet Balance & Filtered Statement Service
**What**: Create service and controller to fetch wallet balance (`GET /api/wallet`) and transactions with status filters.
**Where**: `apps/api/src/modules/wallet/wallet.service.ts`
**Depends on**: T12
**Requirement**: WALLET-01
**Done when**:
- [ ] Returns wallet balance in centavos and formatted BRL.
- [ ] Returns transactions filtered by `status` (`APPROVED`, `DENIED`, `EXPIRED`, `CANCELLED`).
- [ ] Unit tests verify wallet balance queries and filter mapping.
- [ ] Quick gate passes: `npm run test --workspace=apps/api`
**Tests**: unit
**Gate**: quick
**Commit**: `💰 feat(wallet): implement balance queries and filtered transaction statements`

---

#### T14: Implement Withdrawal Requests & Status Tracking
**What**: Implement withdrawal requests (`POST /api/withdrawals`) and status tracking (`GET /api/withdrawals/:id`).
**Where**: `apps/api/src/modules/wallet/withdrawal.service.ts`
**Depends on**: T13
**Requirement**: WALLET-02
**Done when**:
- [ ] Validates Pix key and submits withdrawal to gateway.
- [ ] Persists withdrawal and tracks status updates.
- [ ] Unit tests verify withdrawal creation and status check.
- [ ] Quick gate passes: `npm run test --workspace=apps/api`
**Tests**: unit
**Gate**: quick
**Commit**: `💸 feat(wallet): implement withdrawal requests and status tracking`

---

### Phase 6: Frontend - Merchant Portal & Public Checkout

#### T15: Scaffold React + Vite Frontend with Tailwind
**What**: Setup `apps/web` with Vite, React, TypeScript, Tailwind CSS, and API client.
**Where**: `apps/web/src/App.tsx`
**Depends on**: T14
**Requirement**: AUTH-01
**Done when**:
- [ ] React + Vite app bootstrapped with router, Tailwind, and theme layout.
- [ ] API client configured with correlation and auth tokens.
- [ ] Build gate passes: `npm run build --workspace=apps/web`
**Tests**: none
**Gate**: build
**Commit**: `🎨 feat(web): scaffold react vite application with tailwind and api client`

---

#### T16: Implement Merchant Dashboard, Wallet & Link Manager UI
**What**: Build merchant portal views for wallet balance, statement with filters, withdrawal requests, and link creation.
**Where**: `apps/web/src/pages/DashboardPage.tsx`
**Depends on**: T15
**Requirement**: WALLET-01, WALLET-02, PAY-01
**Done when**:
- [ ] Balance card with real-time refresh.
- [ ] Statement table with status badges and filter dropdowns.
- [ ] Modal/form for checkout link creation and withdrawal request.
- [ ] Build gate passes: `npm run build --workspace=apps/web`
**Tests**: none
**Gate**: build
**Commit**: `🖥️ feat(web): implement merchant dashboard wallet and link manager ui`

---

#### T17: Implement Public Checkout & Printable Receipt Page
**What**: Build responsive customer checkout page with Pix QR code display, Card form with installment fee calculator, and printable receipt.
**Where**: `apps/web/src/pages/CheckoutPage.tsx`
**Depends on**: T16
**Requirement**: PAY-02, PAY-03
**Done when**:
- [ ] Tabbed payment method selector (Pix vs Credit Card).
- [ ] Dynamic installment fee calculation based on `/api/fees`.
- [ ] Real-time status polling for payment confirmation and receipt printing.
- [ ] Build gate passes: `npm run build --workspace=apps/web`
**Tests**: none
**Gate**: build
**Commit**: `🛍️ feat(web): implement public checkout and printable receipt ui`

---

### Phase 7: Docker Compose & End-to-End Verification

#### T18: Create Docker Compose & Production Build Configurations
**What**: Configure multi-stage Dockerfiles for API and Web and `docker-compose.yml` with MySQL 8.
**Where**: `docker-compose.yml`
**Depends on**: T17
**Requirement**: AUTH-01
**Done when**:
- [ ] Multi-stage Dockerfiles for `apps/api` and `apps/web`.
- [ ] `docker-compose.yml` orchestrating MySQL, API, and Web containers with healthchecks.
- [ ] Build gate passes: `npm run build`
**Tests**: none
**Gate**: build
**Commit**: `🐳 feat(docker): create docker compose setup for mysql api and web`

---

#### T19: Comprehensive Documentation & Local Setup Guide
**What**: Write comprehensive `README.md` with architectural explanation, environment variables, step-by-step setup, and flow diagrams.
**Where**: `README.md`
**Depends on**: T18
**Requirement**: AUTH-01
**Done when**:
- [ ] README contains complete instructions, curl examples, Swagger links, and architecture diagrams.
- [ ] All automated tests pass across workspaces.
- [ ] Full gate passes: `npm run test --workspace=apps/api && npm run build`
**Tests**: none
**Gate**: build
**Commit**: `📝 docs: add comprehensive readme and integration guide`

---

## Phase Execution Map

```
Phase 1:  T1 ------→ T2 ------→ T3 ------→ T4
Phase 2:  T5 ------→ T6 ------→ T7
Phase 3:  T8 ------→ T9 ------→ T10
Phase 4:  T11 -----→ T12
Phase 5:  T13 -----→ T14
Phase 6:  T15 -----→ T16 -----→ T17
Phase 7:  T18 -----→ T19
```

---

## Task Granularity Check

| Task | Scope | Status |
| --- | --- | --- |
| T1: Setup Monorepo Workspace | 1 config file | ✅ Granular |
| T2: Scaffold NestJS Backend | 1 entrypoint & config | ✅ Granular |
| T3: Setup TypeORM Entities | 1 entity set & config | ✅ Granular |
| T4: Implement Merchant Auth | 1 module | ✅ Granular |
| T5: Implement Gateway Client | 1 client adapter | ✅ Granular |
| T6: Fee Service | 1 service | ✅ Granular |
| T7: Fee Controller | 1 controller | ✅ Granular |
| T8: Checkout Link Service | 1 service | ✅ Granular |
| T9: Pix Payment Service | 1 payment flow | ✅ Granular |
| T10: Card Payment Service | 1 payment flow | ✅ Granular |
| T11: Webhook Ingestion | 1 controller | ✅ Granular |
| T12: Webhook Idempotent Processor | 1 processor | ✅ Granular |
| T13: Wallet & Statement Service | 1 service | ✅ Granular |
| T14: Withdrawal Service | 1 service | ✅ Granular |
| T15: Frontend Scaffold | 1 app setup | ✅ Granular |
| T16: Merchant Dashboard UI | 1 page set | ✅ Granular |
| T17: Public Checkout UI | 1 page set | ✅ Granular |
| T18: Docker Compose | 1 container orchestration | ✅ Granular |
| T19: Documentation | 1 README | ✅ Granular |

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| --- | --- | --- | --- |
| T1 | None | Start | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T2 | T2 → T3 | ✅ Match |
| T4 | T3 | T3 → T4 | ✅ Match |
| T5 | T4 | T4 → T5 | ✅ Match |
| T6 | T5 | T5 → T6 | ✅ Match |
| T7 | T6 | T6 → T7 | ✅ Match |
| T8 | T7 | T7 → T8 | ✅ Match |
| T9 | T8 | T8 → T9 | ✅ Match |
| T10 | T9 | T9 → T10 | ✅ Match |
| T11 | T10 | T10 → T11 | ✅ Match |
| T12 | T11 | T11 → T12 | ✅ Match |
| T13 | T12 | T12 → T13 | ✅ Match |
| T14 | T13 | T13 → T14 | ✅ Match |
| T15 | T14 | T14 → T15 | ✅ Match |
| T16 | T15 | T15 → T16 | ✅ Match |
| T17 | T16 | T16 → T17 | ✅ Match |
| T18 | T17 | T17 → T18 | ✅ Match |
| T19 | T18 | T18 → T19 | ✅ Match |

---

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| --- | --- | --- | --- | --- |
| T1 | Configuration | none | none | ✅ OK |
| T2 | Configuration / Middleware | none | none | ✅ OK |
| T3 | Entity / Config | unit | unit | ✅ OK |
| T4 | Service / Controller | unit | unit | ✅ OK |
| T5 | Gateway Client | unit | unit | ✅ OK |
| T6 | Service | unit | unit | ✅ OK |
| T7 | Controller | unit | unit | ✅ OK |
| T8 | Service | unit | unit | ✅ OK |
| T9 | Service | unit | unit | ✅ OK |
| T10 | Service | unit | unit | ✅ OK |
| T11 | Controller | unit | unit | ✅ OK |
| T12 | Service | integration | integration | ✅ OK |
| T13 | Service | unit | unit | ✅ OK |
| T14 | Service | unit | unit | ✅ OK |
| T15 | Frontend | none | none | ✅ OK |
| T16 | Frontend | none | none | ✅ OK |
| T17 | Frontend | none | none | ✅ OK |
| T18 | Docker / Config | none | none | ✅ OK |
| T19 | Documentation | none | none | ✅ OK |
