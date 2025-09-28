import { Module } from '@nestjs/common';
import { ClinicsService } from './clinics.service';
import { ClinicsController } from './clinics.controller';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  controllers: [ClinicsController],
  providers: [ClinicsService],
  imports: [DatabaseModule],
})
export class ClinicsModule {}
