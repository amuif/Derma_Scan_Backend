import { Module } from '@nestjs/common';
import { EducationService } from './education.service';
import { EducationController } from './education.controller';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  controllers: [EducationController],
  providers: [EducationService],
  imports: [DatabaseModule],
})
export class EducationModule {}
