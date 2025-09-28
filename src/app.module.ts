import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DatabaseModule } from './database/database.module';
import { DatabaseService } from './database/database.service';
import { ModelsModule } from './models/models.module';
import { EducationModule } from './education/education.module';
import { ClinicsModule } from './clinics/clinics.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    AuthModule,
    UsersModule,
    DatabaseModule,
    ModelsModule,
    EducationModule,
    ClinicsModule,
  ],
  controllers: [AppController],
  providers: [AppService, DatabaseService],
})
export class AppModule {}
