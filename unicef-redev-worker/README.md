# unicef-redev-worker

**Background Worker** for UNICEF Donation Platform. NestJS + Prisma + Bull + Schedule.  
No HTTP server – runs cron jobs and Bull queue processors only.

## Structure

- `src/worker.ts` – Worker entry (NestFactory.createApplicationContext).
- `src/worker/worker.module.ts` – ScheduleModule, BullModule, cron services.
- `src/worker/cron/` – payment, salesforce, email cron.
- `src/worker/processors/` – Bull processors (payment, salesforce, email, report).
- `src/shared/` – Prisma, config, shared modules.

## Scripts

- `npm run build` then `npm run worker` – run worker
- `npm run prisma:generate` – generate Prisma client

## Repo role

REST API lives in **unicef-redev-api**. This repo only runs background work so the API stays fast.
