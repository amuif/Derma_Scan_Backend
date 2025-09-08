import { Injectable, NotFoundException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly databaseService: DatabaseService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || 'super-secret',
    });
  }

  async validate(payload: any) {
    const user = await this.databaseService.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user) {
      throw new NotFoundException('usre not found');
    }

    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      profilePicture: user.profilePicture,
    };
  }
}
