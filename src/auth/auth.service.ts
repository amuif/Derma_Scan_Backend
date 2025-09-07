import { Injectable } from '@nestjs/common';
import { LoginAuthDto } from './dto/login-auth.dto';
import { UsersService } from 'src/users/users.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

  signIn(loginAuthDto: LoginAuthDto) {
    return this.usersService.find(loginAuthDto);
  }

  create(createAuthDto: Prisma.UserCreateInput) {
    console.log('craeting');
    return this.usersService.create(createAuthDto);
  }

  update(id: number, updateAuthDto: Prisma.UserUpdateInput) {
    return this.usersService.update(id, updateAuthDto);
  }

  remove(id: number) {
    return this.usersService.delete(id);
  }
}
