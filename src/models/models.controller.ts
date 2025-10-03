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
  consent: string;
}
@Controller('models')
export class ModelsController {
  constructor(private readonly modelsService: DermService) {}

  @Post('/check')
  @UseInterceptors(FileInterceptor('file'))
  async check(@UploadedFile() file: Express.Multer.File) {
    console.log('Recieved file..');
    return this.modelsService.checkImage(file);
  }

  @Post('/image')
  @UseInterceptors(FileInterceptor('file'))
  async analyze(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: AnalyzeSkinDto,
  ) {
    const { userId, symptoms, consent } = body;

    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const fileName = `${Date.now()}-${userId}.jpg`;
    const filePath = path.join(uploadDir, fileName);

    fs.writeFileSync(filePath, file.buffer);

    return this.modelsService.analyzeSkin(
      file.buffer,
      userId,
      fileName,
      consent,
      symptoms,
    );
  }

  @Post('/text')
  async analyzeText(
    @Body() body: { prompt: string; userId: string; consent: string },
  ) {
    console.log(body);
    return this.modelsService.analyzeSkinViaText(
      body.prompt,
      body.userId,
      body.consent,
    );
  }

  @Get('/history')
  fetch() {
    return this.modelsService.fetch();
  }
}
