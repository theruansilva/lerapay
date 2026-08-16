# BaaS Hardening Specification

## Problem Statement
The current BaaS implementation can disclose merchant data, mix tenants, and manufacture financial success when its gateway integration fails. It must become safe to demonstrate against the BranchPay gateway contract.

## Goals
- [ ] Enforce tenant ownership across BaaS data and gateway operations.
- [ ] Make checkout, withdrawals, and webhooks truthful, idempotent, and contract-safe.
- [ ] Keep merchant, payer, card, and gateway credentials out of public responses and logs.

## Out of Scope
| Feature | Reason |
| --- | --- |
| VPS/domain/HTTPS deployment | Requires user-controlled infrastructure and DNS. |
| Email/WhatsApp delivery | Requires an approved external provider and credentials. |
| Production PCI certification | Requires organizational controls beyond this repository. |

## Assumptions & Open Questions
| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Gateway account model | One encrypted credential record per merchant | Gateway isolation must follow the BaaS merchant. | y |
| Gateway unavailable | Return a 502 and retain no fabricated approval | A financial system must not invent settlement. | y |
| Webhook identity | Use gateway event ID when supplied, otherwise SHA-256 of raw body | Enables durable duplicate detection under the supplied contract. | y |

**Open questions:** none - all resolved or logged above.

## User Stories

### P1: Tenant-safe financial operations
**User Story**: As a merchant, I want to see and affect only my own payments, balance, and withdrawals so that another merchant cannot access my funds or data.

**Acceptance Criteria**:
1. The system SHALL bind every order, withdrawal, and gateway account to exactly one merchant. <!-- ubiquitous -->
2. WHEN an authenticated merchant lists transactions or withdrawals THEN the system SHALL return only records owned by that merchant. <!-- event-driven -->
3. IF an authenticated merchant requests a record owned by another merchant THEN the system SHALL return 404 without revealing its contents. <!-- unwanted-behavior -->
4. WHEN a gateway call is made for an authenticated merchant THEN the system SHALL use that merchant's gateway account. <!-- event-driven -->

### P1: Safe public checkout
**User Story**: As a payer, I want a checkout page that reveals only payment information so that merchant credentials and payer data remain protected.

**Acceptance Criteria**:
1. WHEN a public checkout link is requested THEN the system SHALL return only its public DTO fields. <!-- event-driven -->
2. WHEN a payment gateway request fails THEN the system SHALL return a gateway error and SHALL NOT create an approved order, approved withdrawal, simulated token, QR, EMV, or gateway identifier. <!-- event-driven -->
3. WHILE a checkout link has an active pending order THEN the system SHALL reject a second payment initiation for that link. <!-- state-driven -->

### P1: Reliable gateway callbacks
**User Story**: As a merchant, I want gateway callbacks to update a payment once so that my local state reconciles with the gateway.

**Acceptance Criteria**:
1. WHERE a webhook secret is configured, WHEN a callback arrives THEN the system SHALL validate the HMAC against the exact raw request body. <!-- optional-feature -->
2. WHEN a duplicate callback arrives THEN the system SHALL acknowledge it without applying a second state transition. <!-- event-driven -->
3. WHEN a valid callback contains APPROVED, DENIED, EXPIRED, or CANCELLED THEN the system SHALL apply only an allowed terminal state transition to the owned order or withdrawal. <!-- event-driven -->
4. WHEN a merchant configures callbacks THEN the system SHALL register PAYMENT_PIX, PAYMENT_CARD, and WITHDRAWAL callback URLs with the gateway. <!-- event-driven -->

### P2: Defensive API and demonstrable completion
**User Story**: As an evaluator, I want validated input and an approval receipt so that the workflow is safe and demonstrable.

**Acceptance Criteria**:
1. IF a card, Pix key, document, expiration, pagination, or monetary value is invalid THEN the system SHALL reject the request with 400. <!-- unwanted-behavior -->
2. WHEN an order is approved THEN the public checkout SHALL render a printable receipt without card or credential data. <!-- event-driven -->
3. The system SHALL document required environment variables and truthful gateway failure behavior. <!-- ubiquitous -->

## Edge Cases
- IF a callback is malformed or its signature is invalid THEN the system SHALL reject it without persistence.
- IF a final order state conflicts with a later callback THEN the system SHALL preserve the existing final state.
- IF the gateway cannot provide fees THEN the system SHALL reject card checkout rather than use a fabricated rate.

## Requirement Traceability
| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| TENANT-01 | Tenant-safe financial operations | Security core | Implemented |
| TENANT-02 | Tenant-safe financial operations | Security core | Implemented |
| GATEWAY-01 | Safe public checkout | Security core | Implemented |
| GATEWAY-02 | Safe public checkout | Security core | Implemented |
| CHECKOUT-01 | Safe public checkout | Security core | Pending |
| WEBHOOK-01 | Reliable gateway callbacks | Integration | Pending |
| WEBHOOK-02 | Reliable gateway callbacks | Integration | Implemented |
| WEBHOOK-03 | Reliable gateway callbacks | Integration | Pending |
| INPUT-01 | Defensive API and demonstrable completion | Integration | Pending |
| RECEIPT-01 | Defensive API and demonstrable completion | Integration | Pending |
| DOCS-01 | Defensive API and demonstrable completion | Integration | Pending |

**Coverage:** 11 total, 11 mapped to tasks, 0 unmapped.

## Success Criteria
- [ ] A tenant cannot read or mutate another tenant's financial records in focused tests.
- [ ] Gateway failures never result in a local financial approval.
- [ ] Duplicate or invalid webhooks cannot cause duplicate settlement updates.
