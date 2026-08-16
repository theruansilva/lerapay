# Validation Report: BaaS Hardening

## Validation
**Result**: PASS  
**Diff range**: `a29b356..4625122`  
**Verifier**: Independent (author ≠ verifier)  
**Date**: 2026-08-15  
**Test suite**: 51 tests, 13 suites — all pass against the real tree.

---

## Per-AC Outcome Check

### P1: Tenant-safe financial operations

#### AC1 — Every order, withdrawal, and gateway account bound to one merchant [TENANT-01]
**PASS**  
- `entities.ts:129` — `Order.merchantId` `@Column()` with `@ManyToOne` FK to `User`.  
- `entities.ts:188` — `Withdrawal.merchantId` `@Column()` with `@ManyToOne` FK to `User`.  
- `entities.ts:100` — `CheckoutLink.merchantId` FK present.  
- `pix-payment.service.ts:77` — order created with `merchantId: link.merchantId`.  
- `withdrawal.service.ts:44` — withdrawal created with `merchantId`.  
- `entities.spec.ts:35` — asserts `order.merchantId === 'merchant-uuid-123'`.  
- `entities.spec.ts:48` — asserts `withdrawal.merchantId === 'merchant-uuid-123'`.

#### AC2 — Authenticated merchant sees only own records [TENANT-02]
**PASS**  
- Statement: `wallet.service.ts:64` `.where('order.merchantId = :merchantId', { merchantId })` ✓  
- Balance fallback: `wallet.service.ts:46` `find({ where: { ..., merchantId } })` ✓  
- Withdrawal list: `withdrawal.service.ts:55` `find({ where: { merchantId } })` ✓  
- Withdrawal get: `withdrawal.service.ts:62` `findOne({ where: { id, merchantId } })` ✓  
- `wallet.service.spec.ts` — asserts `mockQueryBuilder.where` called with `'order.merchantId = :merchantId'` and `{ merchantId: 'merchant-123' }`. Mutant M1 now **killed** by this assertion. ✓

#### AC3 — Cross-tenant access returns 404 [TENANT-02]
**PASS (code) / GAP (test)**  
- `withdrawal.service.ts:62` — `findOne({ where: { id, merchantId } })` returns `null` → throws `NotFoundException` at line 64.  
- **Residual gap**: No test asserts that a withdrawal belonging to merchant-B returns 404 when queried by merchant-A. The production guard is correct and was not modified.

#### AC4 — Gateway calls use requesting merchant's account [TENANT-01, TENANT-02]
**PASS**  
- `gateway.client.ts:48` — `authenticate(merchantId)` loads credentials from `userRepo.findOneBy({ id: merchantId })`.  
- `gateway.client.ts:107` — `request<T>(merchantId, ...)` calls `getToken(merchantId)`.  
- All gateway methods (`createPixPayment`, `createCardPayment`, `requestWithdrawal`, `getWallet`, `registerWebhook`) accept and forward `merchantId`.  
- `gateway.client.spec.ts:63` — asserts auth uses merchant's document+password.  
- `gateway.client.spec.ts:49` — asserts cached token returned for correct merchant.

---

### P1: Safe public checkout

#### AC1 — Public checkout returns only public DTO fields [GATEWAY-01]
**PASS**  
- `checkout.controller.ts:54-64` — `getLinkBySlug` returns `{ id, slug, title, description, amountCents, status, expiresAt, merchant: { id, name } }`.  
- No `passwordHash`, `gatewayPassword`, `gatewayToken`, or `gatewayStoreKey` in response.  
- Pix order response (`checkout.controller.ts:74-84`): excludes `payerDocument`, `payerEmail`; returns payment-routing fields only.  
- `checkout-link.service.spec.ts:55` — `findBySlug` returns link; controller projection verified by code inspection.

#### AC2 — Gateway failure does not create approved order [GATEWAY-02]
**PASS**  
- `gateway.client.ts:122-140` — `request<T>` rethrows `HttpException` with status ≥ 502 on upstream error; no default success value.  
- `gateway.client.ts:163` — `getFees` throws `HttpException('Gateway did not return fee rates', BAD_GATEWAY)` when empty; no fallback table.  
- `pix-payment.service.ts:63` — gateway call is awaited; any throw aborts the transaction leaving no persisted order.  
- `card-payment.service.ts:58` — `validateInstallmentFee` throws `BadRequestException` if fee unavailable; gateway call is never reached.  
- `gateway.client.spec.ts:81` — propagates error when gateway call fails.  
- `fees.service.spec.ts:52` — rejects mismatched fee; `fees.service.spec.ts:57` — rejects unavailable installment count.

#### AC3 — Second payment initiation for active pending order is rejected [CHECKOUT-01]
**PASS**  
- `pix-payment.service.ts:56-59` — `findOne({ where: { checkoutLinkId, status: PENDING } })` then throws `BadRequestException`.  
- `pix-payment.service.ts:36` — `lock: { mode: 'pessimistic_write' }` on `CheckoutLink` load; serialises concurrent initiations.  
- `card-payment.service.ts:45-47` — same guard in card path.  
- `pix-payment.service.spec.ts` — "should reject payment if there is an existing PENDING order" exercises the guard; `mockOrderRepo.findOne` returns a PENDING order and confirms `BadRequestException` is thrown. Mutant M4 now **killed** by this test. ✓  
- `card-payment.service.spec.ts` — "should reject payment if there is an existing PENDING order" mirrors the same guard for the card path. ✓

---

### P1: Reliable gateway callbacks

#### AC1 — HMAC validated against exact raw bytes [WEBHOOK-01]
**PASS**  
- `webhook-receiver.service.ts:40-56` — `verifySignature` reads `rawBody` as `Buffer` when it is a `Buffer`, avoids re-serialisation.  
- `webhook-receiver.service.ts:49-54` — `timingSafeEqual` comparison.  
- `webhook-receiver.service.spec.ts:54-63` — sends `Buffer.from(JSON.stringify(payload))` and asserts `event.eventType === 'PAYMENT_PIX'`.  
- `webhook-receiver.service.spec.ts:79-85` — invalid signature throws `UnauthorizedException`. Mutant M3 **killed** by this test. ✓

#### AC2 — Duplicate callback acknowledged without second state transition [WEBHOOK-02]
**PASS**  
- `webhook-receiver.service.ts:99-118` — `ER_DUP_ENTRY` / `duplicate` message → return existing event without re-processing.  
- `webhook-processor.service.ts:35-38` — `if (event.processed) return true` guard.  
- `webhook-receiver.service.spec.ts:88-114` — asserts duplicate returns existing event; `mockEventRepo.create` not called again.  
- `webhook-processor.service.spec.ts:119-126` — asserts `createQueryRunner` not called for already-processed event. Mutant M2 **killed** by this test. ✓

#### AC3 — Allowed terminal state transitions only [WEBHOOK-03]
**PASS**  
- `webhook-processor.service.ts:63-80` — handles `APPROVED`, `DENIED`, `EXPIRED`, `CANCELLED` for orders; `APPROVED`, `DENIED` for withdrawals.  
- `webhook-processor.service.ts:81-86` — `isTerminal` check preserves existing final state.  
- `webhook-processor.service.spec.ts:84-100` — APPROVED + PAID transition asserted.  
- `webhook-processor.service.spec.ts:128-150` — CANCELLED transition asserted.  
- `webhook-processor.service.spec.ts:152-187` — terminal APPROVED state preserved against late DENIED update.

#### AC4 — PAYMENT_PIX, PAYMENT_CARD, WITHDRAWAL callbacks registered [WEBHOOK-03 / T8]
**PASS**  
- `webhook-receiver.service.ts:130-147` — `registerAllWebhooks` loops over `['PAYMENT_PIX', 'PAYMENT_CARD', 'WITHDRAWAL']`.  
- `webhook-receiver.service.spec.ts:135-154` — asserts `registerWebhook` called 3 times with exact event types in order.

---

### P2: Defensive API and demonstrable completion

#### AC1 — Invalid inputs rejected with 400 [INPUT-01]
**PASS**  
- `checkout.dto.ts:56` — `@Matches(/^[0-9]{13,19}$/)` on `cardNumber`.  
- `checkout.dto.ts:66` — `@Matches(/^(0[1-9]|1[0-2])$/)` on `cardExpirationMonth`.  
- `checkout.dto.ts:71` — `@Matches(/^([0-9]{2}|[0-9]{4})$/)` on `cardExpirationYear`.  
- `checkout.dto.ts:76` — `@Matches(/^[0-9]{3,4}$/)` on `cardCvv`.  
- `checkout.dto.ts:48` — `@Matches(/^[0-9]{11}$|^[0-9]{14}$/)` on `payerDocument`.  
- `withdrawal.dto.ts:62` — `@IsInt() @Min(100) @Max(100000000)` on `amountCents`.  
- `withdrawal.dto.ts:68` — `@IsValidPixKey()` cross-validates key against `pixKeyType`.  
- `main.ts:21-26` — global `ValidationPipe` with `whitelist: true, forbidNonWhitelisted: true`.  
- `checkout.dto.spec.ts` — 6 tests; month 13 / year 3-digit / CVV 2-digit / installments 25 all rejected.  
- `withdrawal.dto.spec.ts` — tests invalid Pix key formats.

#### AC2 — Approved checkout renders printable receipt without card/credential data [RECEIPT-01]
**PASS**  
- `CheckoutPage.tsx:312-374` — `if (activeOrder && activeOrder.status === 'APPROVED')` renders receipt.  
- Receipt fields (`CheckoutPage.tsx:319-373`): status, amount, method, product, externalReference, date. No card PAN, CVV, holder name, gateway token, or merchant password in rendered output.  
- `OrderData` interface (`CheckoutPage.tsx:55-63`): no card credential fields defined.  
- Print button at line 368: `window.print()`.

#### AC3 — Required env vars and truthful gateway failure documented [DOCS-01]
**PASS**  
- `.env.example` — documents `GATEWAY_API_URL`, `GATEWAY_EMAIL`, `GATEWAY_PASSWORD`, `GATEWAY_CLIENT_CODE`, `GATEWAY_STORE_KEY`, `GATEWAY_WEBHOOK_SECRET`, `CORS_ALLOWED_ORIGINS` with inline comments.  
- `.env.example:19-20` — "There is no simulation fallback; real gateway credentials are required."  
- `README.md` — Section "Segurança & Idempotência" explicitly states credentials reside in backend only; webhook HMAC signature setup documented; no-simulation stated in step 2 of Docker quickstart.

---

## Edge Cases (from spec)

| Edge case | Status | Evidence |
|---|---|---|
| Malformed or invalid-signature callback rejected without persistence | PASS | `webhook-receiver.service.ts:77-80`; `spec:79-85` |
| Final order state preserved against later conflicting callback | PASS | `webhook-processor.service.ts:81-86`; `spec:152-187` |
| Gateway cannot provide fees → reject card checkout | PASS | `fees.service.ts:32-34` throws; `gateway.client.ts:163` throws `BAD_GATEWAY`; no fallback table |

---

## Discrimination Sensor Results

Five mutants injected in an isolated copy (real tree never mutated during testing; restored before final suite run).

| # | Mutation | Target | Killed? | Killing test |
|---|---|---|---|---|
| M1 | Remove `merchantId` tenant filter from `getStatement` `.where()` | `wallet.service.ts:64` | **KILLED** | `wallet.service.spec.ts` — "should return statement transactions with filters" asserts `mockQueryBuilder.where` called with `'order.merchantId = :merchantId'` and `{ merchantId: 'merchant-123' }` |
| M2 | Remove `if (event.processed) return true` idempotency guard | `webhook-processor.service.ts:35-38` | KILLED | `webhook-processor.service.spec.ts:119-126` |
| M3 | Remove HMAC `timingSafeEqual` check (accept all signatures) | `webhook-receiver.service.ts:50-53` | KILLED | `webhook-receiver.service.spec.ts:79-85` |
| M4 | Remove pending-order guard from Pix payment initiation | `pix-payment.service.ts:56-59` | **KILLED** | `pix-payment.service.spec.ts` — "should reject payment if there is an existing PENDING order" returns PENDING order from `mockOrderRepo.findOne` and asserts `BadRequestException` |
| M5 | Replace `validateInstallmentFee` call with `dto.feePercent` literal | `card-payment.service.ts:57-61` | KILLED | `card-payment.service.spec.ts:132` |

**All five mutants killed. No survivors.**

---

## Residual Gap (non-blocking)

| Gap | AC | Severity | Description |
|---|---|---|---|
| Cross-tenant 404 not tested for withdrawals | TENANT-02 | Low | No test asserts withdrawal GET by wrong merchant returns 404. Production guard `findOne({ where: { id, merchantId } })` is correct; gap does not affect verdict. |

---

## Production CORS

`main.ts:10-17` — In `NODE_ENV=production`, CORS origin is restricted to `CORS_ALLOWED_ORIGINS` env var (comma-separated). If the env var is absent in production, `origin` becomes `[]` (deny all), which is safe-by-default. In development, `origin: '*'` is used.

---

## Verdict

**PASS** — All 11 acceptance criteria are implemented correctly in production code. All five behavior-level mutants are killed by the test suite (51 tests, 13 suites). No fabricated approvals, no cross-tenant data leakage, and no credential exposure were found. One low-severity residual gap (cross-tenant 404 for withdrawals) is noted but does not block closure: the production guard is correct, and the gap reduces test coverage only — not safety.
