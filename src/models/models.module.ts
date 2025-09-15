import { Module } from '@nestjs/common';
import { ModelsController } from './models.controller';
import { HttpModule } from '@nestjs/axios';
import { DermService } from './models.service';

@Module({
  imports: [HttpModule],
  controllers: [ModelsController],
  providers: [DermService],
})
export class ModelsModule {}
