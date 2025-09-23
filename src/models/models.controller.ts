import { Controller, Post, Body, Get } from '@nestjs/common';
import { DermService } from './models.service';
import * as fs from 'fs';
import * as path from 'path';
interface AnalyzeSkinDto {
  image: string;
  symptoms?: string;
  userId: string;
}
@Controller('models')
export class ModelsController {
  constructor(private readonly modelsService: DermService) {}

  @Post('/image')
  async analyze(@Body() body: AnalyzeSkinDto) {
    const { image, userId, symptoms } = body;
    const buffer = Buffer.from(image, 'base64');

    // Always resolve uploads folder from project root
    const uploadDir = path.join(process.cwd(), 'uploads');

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileName = `${Date.now()}-${userId}.jpg`;
    const filePath = path.join(uploadDir, fileName);

    fs.writeFileSync(filePath, buffer);
    return this.modelsService.analyzeSkin(buffer, userId, fileName, symptoms);
  }

  @Get('/history')
  fetch() {
    return this.modelsService.fetch();
  }
}
