import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET', 'lerapay_default_super_secret_jwt_key_2026'),
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload || !payload.sub) {
      throw new UnauthorizedException();
    }
    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
    };
  }
}
