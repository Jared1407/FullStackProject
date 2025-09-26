import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as fs from 'fs';
import * as path from 'path';
import 'reflect-metadata';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  const port = process.env.PORT || 3500;

  // Ensure logs dir
  const logPath = process.env.LOG_PATH || './logs/audit.log';
  const logDir = path.dirname(logPath);
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

  await app.listen(port);
  console.log(`API listening on http://localhost:${port}`);
}
bootstrap();
