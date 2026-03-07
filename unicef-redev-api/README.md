# unicef-redev-api

**Backend REST API** for UNICEF Donation Platform. NestJS + Prisma (PostgreSQL).  
GraphQL is planned for future; this repo serves only HTTP REST.

## Structure

- `src/main.ts` – REST API entry (no cron, no Bull).
- `src/shared/` – Prisma, config, shared modules (donations, transactions, payments, salesforce, email, reports).
- `src/rest/` – REST controllers and modules: auth, users, donations, transactions, payments, media, content, reports.
- `src/rest/common/` – decorators, filters, guards, interceptors, pipes.

## Scripts

- `npm run start:dev` – start API with watch
- `npm run prisma:generate` – generate Prisma client
- `npm run prisma:push` – push schema to DB

## Repo role

This repo is **REST API only**. Background jobs (cron, Bull) run in **unicef-redev-worker**.
