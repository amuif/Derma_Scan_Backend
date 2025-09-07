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
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { Prisma } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';
import { type JwtPayload } from './get-user.decorator';

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

  @Post('/signup')
  create(@Body() createAuthDto: Prisma.UserCreateInput) {
    return this.authService.create(createAuthDto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAuthDto: UpdateAuthDto) {
    return this.authService.update(+id, updateAuthDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.authService.remove(+id);
  }
}
