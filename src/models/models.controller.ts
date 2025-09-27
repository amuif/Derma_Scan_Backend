import {
  Controller,
  Post,
  Body,
  Get,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { DermService } from './models.service';
import * as fs from 'fs';
import * as path from 'path';
import { FileInterceptor } from '@nestjs/platform-express';
interface AnalyzeSkinDto {
  image: string;
  symptoms?: string;
  userId: string;
}
@Controller('models')
export class ModelsController {
  constructor(private readonly modelsService: DermService) {}

  @Post('/image')
  @UseInterceptors(FileInterceptor('file'))
  async analyze(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: AnalyzeSkinDto,
  ) {
    const { userId, symptoms } = body;

    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const fileName = `${Date.now()}-${userId}.jpg`;
    const filePath = path.join(uploadDir, fileName);

    fs.writeFileSync(filePath, file.buffer);

    return this.modelsService.analyzeSkin(
      file.buffer,
      userId,
      fileName,
      symptoms,
    );
  }

  @Get('/history')
  fetch() {
    return this.modelsService.fetch();
  }
}
