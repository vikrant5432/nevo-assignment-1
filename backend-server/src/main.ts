// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { AppService } from './app.service';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  let retries = 3;

  while (retries > 0) {
    try {
      const app = await NestFactory.create(AppModule);
      app.enableCors();

      // Get AppService instance
      const appService = app.get(AppService);

      // Connections will be tested in onModuleInit
      // but we can force a test here if needed
      const connectionsValid = await appService.testConnections();

      if (!connectionsValid) {
        throw new Error('Connection testing failed');
      }

      const port = process.env.PORT || 3000;
      await app.listen(port);
      logger.log(`🚀 Application is running on: http://localhost:${port}`);
      break;
    } catch (error) {
      retries--;
      if (retries === 0) {
        logger.error('❌ Failed to start server after 3 attempts');
        process.exit(1);
      }
      logger.warn(
        `⚠️ Server start failed. Retrying... (${retries} attempts remaining)`,
      );
      console.log(error);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

bootstrap();
