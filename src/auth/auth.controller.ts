import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
  Get,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginAuthDto } from './dto/login-auth.dto';
import { Prisma } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';
import { type JwtPayload } from './get-user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerConfig } from 'multer.config';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  get(@Req() req: Request & { user: JwtPayload }) {
    return req.user;
  }

  @Post('/login')
  login(@Body() loginAuthDto: LoginAuthDto) {
    return this.authService.signIn(loginAuthDto);
  }

  @UseInterceptors(FileInterceptor('profilePicture', multerConfig))
  @Post('/signup')
  create(@Body() createAuthDto: Prisma.UserCreateInput) {
    return this.authService.create(createAuthDto);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('profilePicture', multerConfig))
  async updateUser(
    @Param('id') id: string,
    @Body() updateAuthDto: Prisma.UserUpdateInput,
    @UploadedFile() file: Express.Multer.File,
  ) {
    console.log(file);
    return this.authService.update(id, updateAuthDto, file);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.authService.remove(id);
  }
}
