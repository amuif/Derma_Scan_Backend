import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import * as bcrypt from 'bcrypt';
import { Prisma, User } from '@prisma/client';
import { LoginAuthDto } from 'src/auth/dto/login-auth.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UsersService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly jwtService: JwtService,
  ) {}

  async find(
    loginAuthDto: LoginAuthDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const { email, password } = loginAuthDto;
    if (!email || !password) {
      throw new BadRequestException('Invalid credentials', {
        cause: new Error(),
        description: 'There are missing inputs',
      });
    }

    const existingUser = await this.databaseService.user.findUnique({
      where: { email },
    });
    if (!existingUser) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const doPasswordMatch = await bcrypt.compare(
      password,
      existingUser.password,
    );
    if (!doPasswordMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.generateTokens(existingUser);
    return tokens;
  }

  async create(createAuthDto: Prisma.UserCreateInput): Promise<{
    user: Omit<User, 'password'>;
    tokens: { accessToken: string; refreshToken: string };
  }> {
    const { email, password, username, name } = createAuthDto;
    if (!email || !password || !username || !name) {
      throw new BadRequestException('Invalid credentials', {
        cause: new Error(),
        description: 'There are missing inputs',
      });
    }
    const existingUser = await this.databaseService.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException('Email is already taken');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.databaseService.user.create({
      data: {
        email,
        username: createAuthDto.username,
        name: createAuthDto.name,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        createdAt: true,
        profilePicture: true,
        updatedAt: true,
      },
    });

    const tokens = await this.generateTokens(user);

    return { user: user, tokens };
  }

  async update(
    id: number,
    updateDto: Prisma.UserUpdateInput,
  ): Promise<Partial<User> | null> {
    const user = await this.databaseService.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    let updatedPassword: string | undefined = undefined;
    if (updateDto.password) {
      updatedPassword = await bcrypt.hash(updateDto.password, 10);
    }
    const updateUser = await this.databaseService.user.update({
      where: { id },
      data: {
        ...updateDto,
        ...(updatedPassword ? { password: updatedPassword } : {}),
      },
      select: {
        email: true,
        username: true,
        profilePicture: true,
        name: true,
        updatedAt: true,
        createdAt: true,
      },
    });

    return updateUser;
  }

  async delete(id: number) {
    const user = await this.databaseService.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('user not found');
    }
    await this.databaseService.user.delete({ where: { id } });
    return { message: 'User deleted succeffuly!' };
  }

  private async generateTokens(user: Partial<User>) {
    const payload = { sub: user.id, email: user.email };
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '15m',
    });
    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }
}
