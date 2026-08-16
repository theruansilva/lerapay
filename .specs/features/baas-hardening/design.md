# BaaS Hardening Design

## Decision
Use the existing NestJS modules and TypeORM repositories. Add direct `merchantId` ownership to financial records and a `gateway_accounts` record per merchant; do not introduce a second service or queue.

## Components
- `GatewayAccount`: encrypted gateway credentials per merchant; a gateway client authenticates for the requested account instead of using process-global credentials.
- Tenant-aware repositories: every merchant route passes `req.user.id` to its service; public checkout never loads or serializes `User`.
- Payments: create a pending order under a transactional lock before calling the gateway; gateway failure leaves a rejected request, never a fabricated result.
- Webhooks: Nest retains raw body, HMAC uses raw bytes, and a unique event key deduplicates callbacks. The processor allows only forward state transitions.
- Checkout receipt: existing public page renders receipt data already returned for an approved order.

## Data flow
`JWT merchant -> service(merchantId) -> own GatewayAccount -> gateway`.
`gateway callback(raw body) -> HMAC -> unique WebhookEvent -> transaction -> owned Order/Withdrawal`.

## Security invariants
- Entities are never returned as public API responses.
- All financial records include and query by `merchantId`.
- PAN/CVV are only forwarded to the gateway and neither stored nor logged.
- Missing gateway configuration or upstream failure is a 502, not a simulation.
