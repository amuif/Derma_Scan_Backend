import { Controller, Post, Body } from '@nestjs/common';
import { DermService } from './models.service';

interface AnalyzeSkinDto {
  image: string;
  symptoms?: string;
}
@Controller('models')
export class ModelsController {
  constructor(private readonly modelsService: DermService) {}

  @Post('/image')
  async analyze(@Body() body: AnalyzeSkinDto) {
    const { image, symptoms } = body;

    const buffer = Buffer.from(image, 'base64');

    return this.modelsService.analyzeSkin(buffer, symptoms);
  }
}
