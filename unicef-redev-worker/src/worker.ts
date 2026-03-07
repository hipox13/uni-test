import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker/worker.module';

/**
 * Worker entry point. Runs cron jobs and Bull queue processors only.
 * No HTTP server. Do not add REST controllers here.
 */
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(WorkerModule);
  await app.init();
  console.log('Worker started (cron + Bull). No HTTP.');
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
