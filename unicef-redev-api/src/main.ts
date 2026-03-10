import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// BigInt JSON polyfill
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend
  const allowedOrigins = [
    process.env.CMS_URL,
    process.env.WEB_URL,
    process.env.DONOR_PORTAL_URL,
    'http://localhost:5174',
    'http://localhost:3000',
  ].filter(Boolean).map(url => url!.replace(/\/$/, '')) as string[];

  app.enableCors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties exist
      transform: true, // Auto-transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Auto-convert string to number, etc.
      },
    }),
  );

  const port = Number(process.env.PORT) || 3000;
  try {
    await app.listen(port);
    console.log(`REST API listening on http://localhost:${port}`);
  } catch (err: any) {
    if (err?.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use. Stop the other process or set PORT to another value (e.g. PORT=3002 in .env).`);
    }
    throw err;
  }
}
bootstrap();
