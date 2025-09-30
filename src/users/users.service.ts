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
  ): Promise<{ accessToken: string; user: Omit<User, 'password'> }> {
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

    const accessToken = await this.generateTokens(existingUser);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...userWithoutPassword } = existingUser;

    return { accessToken, user: userWithoutPassword };
  }

  async create(
    createAuthDto: Prisma.UserCreateInput,
    filename?: string,
  ): Promise<{
    user: Omit<User, 'password'>;
    accessToken: string;
  }> {
    const { email, password, name } = createAuthDto;
    console.log(createAuthDto);
    if (!email || !password || !name) {
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
        name: createAuthDto.name,
        password: hashedPassword,
        profilePicture: filename ? `/uploads/${filename}` : null,
        role: 'USER',
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        profilePicture: true,
        updatedAt: true,
        role: true,
      },
    });

    const tokens = await this.generateTokens(user);

    return { user: user, accessToken: tokens };
  }

  async getUser(id: string) {
    const user = await this.databaseService.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
  async update(
    id: string,
    updateDto: Prisma.UserUpdateInput,
    file: Express.Multer.File,
  ): Promise<{ user: Partial<User> | null }> {
    console.log('id', id);
    console.log(file);
    if (!updateDto) {
      throw new BadRequestException('Update data is required');
    }
    const user = await this.databaseService.user.findUnique({ where: { id } });
    console.log('updating', user?.name);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    console.log(updateDto);
    let updatedPassword: string | undefined = undefined;

    if (updateDto.password && typeof updateDto.password === 'string') {
      updatedPassword = await bcrypt.hash(updateDto.password, 10);
    }

    const updateData: Prisma.UserUpdateInput = {
      ...updateDto,
    };

    if (updatedPassword) {
      updateData.password = updatedPassword;
    }

    if (file) {
      updateData.profilePicture = `/uploads/${file.filename}`;
    }
    const updateUser = await this.databaseService.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        profilePicture: true,
        name: true,
        updatedAt: true,
        createdAt: true,
      },
    });

    return { user: updateUser };
  }

  async delete(id: string) {
    console.log(id);
    const user = await this.databaseService.user.findUnique({ where: { id } });
    console.table(user);
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

    return accessToken;
  }
}
