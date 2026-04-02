// jwt.strategy.ts
import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(config: ConfigService) {
    const jwtSecret = config.get<string>('SUPABASE_JWT_SECRET');
    
    if (!jwtSecret) {
      throw new Error('❌ SUPABASE_JWT_SECRET not configured in environment variables!');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret, // ✅ ONLY use Supabase JWT secret
    });

    this.logger.log('✅ JWT Strategy initialized with SUPABASE_JWT_SECRET');
  }

  async validate(payload: any) {
    // Payload structure from Supabase JWT
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.user_metadata?.role || 'user',
      firm_id: payload.user_metadata?.firm_id,
      aud: payload.aud,
    };
  }
}
