import { Injectable, Logger, UnauthorizedException, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { SUPABASE_CLIENT } from '../../config/supabase.module';
import { SupabaseClient } from '@supabase/supabase-js';

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
    const userId = payload.sub;

    // 🔥 FETCH USER FROM DB (CRITICAL FIX)
    const { data: user, error } = await this.supabase
      .from('users')
      .select('id, email, role, firm_id')
      .eq('id', userId)
      .single();

    if (error || !user) {
      this.logger.error('❌ User not found in DB');
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      firm_id: user.firm_id, // ✅ NOW ALWAYS PRESENT
    };
  }
}
