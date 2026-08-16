# BaaS Hardening Tasks

**Design**: `.specs/features/baas-hardening/design.md`
**Status**: Approved

## Test Coverage Matrix
> Generated from `AGENTS.md`, existing Jest co-located specs, and the specification.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| Nest services | unit | Changed branches and every requirement/error path | `src/**/*.spec.ts` | `bun run test` |
| Controllers | unit | Auth boundary and response DTO behavior | `src/**/*.spec.ts` | `bun run test` |
| Entities/config | unit | Model invariants | `src/**/*.spec.ts` | `bun run test` |
| Frontend | build | Compile and render changed checkout path | `src/**/*.spec.ts` | `bun run build` |

## Gate Check Commands
| Gate Level | When to Use | Command |
| --- | --- | --- |
| Quick | Service/controller task | `bun run test` |
| Build | Schema or frontend task | `bun run build` |
| Full | Phase completion | `bun run test && bun run build` |

## Execution Plan
### Phase 1: Tenant security
`T1 → T2 → T3 → T4`

### Phase 2: Truthful gateway behavior
`T5 → T6 → T7`

### Phase 3: Callback and user completion
`T8 → T9`

## Task Breakdown

### [x] T1: Add merchant ownership fields
**What**: Add tenant ownership and durable webhook identity columns to the TypeORM model.
**Where**: `apps/api/src/database/entities.ts`
**Depends on**: None
**Reuses**: Existing TypeORM entity patterns
**Requirement**: TENANT-01, WEBHOOK-02
**Tools**: MCP: NONE; Skill: ponytail
**Done when**: Order and Withdrawal require merchantId; WebhookEvent has a unique deduplication key; entity tests pass.
**Tests**: unit
**Gate**: quick
**Commit**: `♻️ refactor(database): scope financial records to merchants`

### [x] T2: Scope wallet records to merchants
**What**: Pass merchant identity through wallet and withdrawal operations and query only owned records.
**Where**: `apps/api/src/modules/wallet/wallet.service.ts`
**Depends on**: T1
**Reuses**: JWT request user pattern
**Requirement**: TENANT-02
**Tools**: MCP: NONE; Skill: ponytail
**Done when**: Statement, balance fallback, withdrawal request/list/get are tenant-scoped and foreign IDs return 404.
**Tests**: unit
**Gate**: quick
**Commit**: `🐛 fix(wallet): isolate merchant financial records`

### [x] T3: Add tenant gateway accounts
**What**: Persist per-merchant gateway credentials and resolve gateway authentication by merchant account.
**Where**: `apps/api/src/modules/gateway/gateway.client.ts`
**Depends on**: T1
**Reuses**: ConfigService and existing gateway request types
**Requirement**: TENANT-01, TENANT-02
**Tools**: MCP: NONE; Skill: ponytail
**Done when**: Gateway methods receive merchant context and no process-global simulated token is returned.
**Tests**: unit
**Gate**: quick
**Commit**: `✨ feat(gateway): authenticate per merchant account`

### [x] T4: Return explicit public checkout DTOs
**What**: Stop returning TypeORM entities and protect merchant and payer data on public checkout endpoints.
**Where**: `apps/api/src/modules/checkout/checkout-link.service.ts`
**Depends on**: T1
**Reuses**: Existing checkout DTOs
**Requirement**: GATEWAY-01
**Tools**: MCP: NONE; Skill: ponytail
**Done when**: Public link and order-status responses exclude user, password, gateway, and payer fields.
**Tests**: unit
**Gate**: quick
**Commit**: `🐛 fix(checkout): hide merchant and payer data`

### [x] T5: Remove financial simulation fallbacks
**What**: Propagate gateway authentication, fee, Pix, card, and withdrawal failures without manufactured success data.
**Where**: `apps/api/src/modules/gateway/gateway.client.ts`
**Depends on**: T2, T3
**Reuses**: Existing HttpException translation
**Requirement**: GATEWAY-02
**Tools**: MCP: NONE; Skill: ponytail
**Done when**: Failed upstream calls produce 502 and no approved local payment or withdrawal is persisted.
**Tests**: unit
**Gate**: quick
**Commit**: `🐛 fix(gateway): fail safely on upstream errors`

### [x] T6: Lock checkout payment initiation
**What**: Prevent concurrent payment attempts from charging one checkout link twice and persist merchant ownership on orders.
**Where**: `apps/api/src/modules/checkout/pix-payment.service.ts`
**Depends on**: T2, T5
**Reuses**: TypeORM DataSource transactions
**Requirement**: CHECKOUT-01
**Tools**: MCP: NONE; Skill: ponytail
**Done when**: An active pending order blocks a second initiation and every order carries its link merchantId.
**Tests**: unit
**Gate**: quick
**Commit**: `🐛 fix(checkout): serialize payment initiation`

### [x] T7: Snapshot verified card fees
**What**: Persist the verified brand, installment count, and fee snapshot before card charging and reject unavailable gateway rates.
**Where**: `apps/api/src/modules/fees/fees.service.ts`
**Depends on**: T5
**Reuses**: Existing fee lookup
**Requirement**: GATEWAY-02
**Tools**: MCP: NONE; Skill: ponytail
**Done when**: No default fee table is used and an order preserves the gateway-verified rate.
**Tests**: unit
**Gate**: quick
**Commit**: `🐛 fix(fees): require gateway fee snapshots`

### [x] T8: Authenticate and deduplicate webhooks
**What**: Validate HMAC over raw bytes, register required gateway callbacks, and atomically deduplicate state updates.
**Where**: `apps/api/src/modules/webhooks/webhook-receiver.service.ts`
**Depends on**: T1, T3, T6
**Reuses**: Existing HMAC and transaction processor
**Requirement**: WEBHOOK-01, WEBHOOK-02, WEBHOOK-03
**Tools**: MCP: NONE; Skill: ponytail
**Done when**: Invalid callbacks persist nothing, duplicate callbacks mutate once, terminal transitions include CANCELLED, and callback registration exists.
**Tests**: unit
**Gate**: quick
**Commit**: `🐛 fix(webhooks): verify and deduplicate callbacks`

### [x] T9: Validate trust boundaries and finish checkout
**What**: Strengthen financial DTO validation, restrict production CORS, add printable approved receipt, and correct README claims.
**Where**: `apps/api/src/modules/checkout/dto/checkout.dto.ts`
**Depends on**: T4, T6, T7, T8
**Reuses**: class-validator and CheckoutPage
**Requirement**: INPUT-01, RECEIPT-01, DOCS-01
**Tools**: MCP: NONE; Skill: ponytail
**Done when**: Invalid payment inputs are rejected, approved checkout renders a safe receipt, production CORS is explicit, and setup documentation is truthful.
**Tests**: unit
**Gate**: full
**Commit**: `✨ feat(checkout): validate payment inputs and receipt`

## Phase Execution Map
`T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8 → T9`

## Task Granularity Check
| Task | Scope | Status |
| --- | --- | --- |
| T1-T9 | One cohesive source concern plus its co-located tests | ✅ Granular |

## Diagram-Definition Cross-Check
| Task | Depends On | Diagram Shows | Status |
| --- | --- | --- | --- |
| T1 | None | None | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T1 | T1 → T3 | ✅ Match |
| T4 | T1 | T1 → T4 | ✅ Match |
| T5 | T2,T3 | T2,T3 → T5 | ✅ Match |
| T6 | T2,T5 | T2,T5 → T6 | ✅ Match |
| T7 | T5 | T5 → T7 | ✅ Match |
| T8 | T1,T3,T6 | T1,T3,T6 → T8 | ✅ Match |
| T9 | T4,T6,T7,T8 | T4,T6,T7,T8 → T9 | ✅ Match |

## Test Co-location Validation
| Task | Code Layer | Matrix Requires | Task Says | Status |
| --- | --- | --- | --- | --- |
| T1-T8 | Nest service/entity | unit | unit | ✅ OK |
| T9 | DTO/frontend/config | unit/build | unit | ✅ OK |
