import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { existsSync, mkdirSync, readdirSync } from 'fs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Enable CORS
  app.enableCors({
    origin: ['exp://10.210.144.247:8081', 'http://localhost:8081', 'http://10.210.144.247:8081', 'http://10.210.144.83:4000'],
    credentials: true,
  });

  app.setGlobalPrefix('api');

  // Use process.cwd() to get the PROJECT ROOT, not dist folder
  const uploadsPath = join(process.cwd(), 'uploads');
  console.log('Static files path:', uploadsPath);
  console.log('Directory exists:', existsSync(uploadsPath));
  
  if (existsSync(uploadsPath)) {
    app.useStaticAssets(uploadsPath, {
      prefix: '/uploads/',
    });
    Logger.log('✅ Static assets configured successfully');
  } else {
    Logger.warn('❌ Uploads directory not found, creating it...');
    // Create the uploads directory if it doesn't exist
    mkdirSync(uploadsPath, { recursive: true });
    app.useStaticAssets(uploadsPath, {
      prefix: '/uploads/',
    });
  }

  const port = process.env.PORT || 4000;
  
  await app.listen(port);
  Logger.log(`🚀 Server running on http://10.210.144.83:${port}`);
  Logger.log(`📁 Static files: http://10.210.144.83:${port}/uploads/`);
  
  // Log files in uploads folder
  if (existsSync(uploadsPath)) {
    const files = readdirSync(uploadsPath);
    console.log('Files in uploads folder:', files);
  }
}

bootstrap();
