# Decisions Log (AD-NNN) & Project State

## AD-001: Architecture, Repository Structure & Workspace
- **Date**: 2026-08-14
- **Decision**: Monorepo managed with NPM workspaces (`apps/api` for NestJS backend, `apps/web` for React/Vite frontend).
- **Rationale**: Keeps full stack in a single repository with shared dependencies and unified Docker Compose orchestration without extra tool bloat.

## AD-002: Gateway Authentication & Credential Management
- **Date**: 2026-08-14
- **Decision**: Support both runtime account provisioning/linking and pre-configured environment variables (`GATEWAY_EMAIL`, `GATEWAY_PASSWORD`, `GATEWAY_CLIENT_CODE`, `GATEWAY_STORE_KEY`).
- **Rationale**: Allows instant local developer onboarding/testing while fulfilling the requirement to authenticate against `https://api.branchpay.com.br/api` without exposing secrets to the frontend.

## AD-003: Monetary Precision & Amount Representation
- **Date**: 2026-08-14
- **Decision**: All financial amounts in the database, API contracts, and gateway integration are represented as integers in **cents** (`centavos`).
- **Rationale**: Prevents floating-point arithmetic errors across transactions, fees, installments, and wallet balances.

## AD-004: Webhook Processing & Idempotency
- **Date**: 2026-08-14
- **Decision**: Webhook events are captured raw into `webhook_events`, validated via HMAC/signature if present, and processed with database transaction idempotency locks on `externalReference` and `orderId`.
- **Rationale**: Protects ledger consistency against network retries or out-of-order gateway callbacks.
