import { Module } from '@nestjs/common';
import { ModelsController } from './models.controller';
import { HttpModule } from '@nestjs/axios';
import { DermService } from './models.service';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [HttpModule, DatabaseModule],
  controllers: [ModelsController],
  providers: [DermService],
})
export class ModelsModule {}
