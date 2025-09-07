import {
  BadRequestException,
  Injectable,
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
    const { email } = createAuthDto;

    const existingUser = await this.databaseService.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException('Email is already taken');
    }

    const hashedPassword = await bcrypt.hash(createAuthDto.password, 10);

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

  async findByEmail(email: string): Promise<User | null> {
    return this.databaseService.user.findUnique({ where: { email } });
  }

  async findById(id: number): Promise<User | null> {
    return this.databaseService.user.findUnique({ where: { id } });
  }
}
