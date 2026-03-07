import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { PaymentRetryService } from './src/shared/scheduler/payment-retry.service';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const service = app.get(PaymentRetryService);

    console.log('--- Manually Triggering Retry ---');
    await service.retryMonthlyPayments();
    console.log('--- Done ---');

    await app.close();
    process.exit(0);
}

bootstrap();
