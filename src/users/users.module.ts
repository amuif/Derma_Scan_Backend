import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { DatabaseModule } from 'src/database/database.module';
import { JwtModule } from '@nestjs/jwt';
@Module({
  providers: [UsersService],
  exports: [UsersService],
  imports:[DatabaseModule, JwtModule.register({
      secret: process.env.JWT_SECRET || 'super-secret', 
      signOptions: { expiresIn: '1h' },
    }),]
})
export class UsersModule {}
