import {
  Injectable,
  UnauthorizedException,
  Inject,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../config/supabase.module';
import { LoginDto } from './dto/login.dto';
import { OtpDto } from './dto/otp.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
    private readonly jwtService: JwtService,
  ) {}

  // ───────────────── LOGIN ─────────────────
  async loginWithPassword(dto: LoginDto) {
    this.logger.log(`Login attempt: ${dto.email}`);

    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: dto.email,
      password: dto.password,
    });

    if (error || !data?.user) {
      this.logger.error(`Supabase login failed: ${error?.message}`);
      throw new UnauthorizedException('Invalid login credentials');
    }

    this.logger.log(`Supabase login success: ${data.user.id}`);

    // 🔥 IMPORTANT FIX: ensure profile exists
    const { data: userData, error: userError } = await this.supabase
      .from('users')
      .select('*, firms(*)')
      .eq('id', data.user.id)
      .maybeSingle(); // ✅ changed from .single()

    if (userError) {
      this.logger.error(`DB error: ${userError.message}`);
      throw new UnauthorizedException('User fetch failed');
    }

    if (!userData) {
      this.logger.error(`❌ No profile found for user: ${data.user.id}`);
      throw new UnauthorizedException('User profile not found');
    }

    if (!userData.is_active) {
      throw new UnauthorizedException('Account deactivated');
    }

    this.logger.log(`✅ User profile loaded: ${userData.email}`);

    return {
      access_token: data.session?.access_token,
      refresh_token: data.session?.refresh_token,
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        firm_id: userData.firm_id,
        firm_name: userData.firms?.name,
        avatar_url: userData.avatar_url,
      },
    };
  }

  // ───────────────── OTP ─────────────────
  async sendOtp(phone: string) {
    const { error } = await this.supabase.auth.signInWithOtp({ phone });

    if (error) {
      this.logger.error(`OTP send failed: ${error.message}`);
      throw new UnauthorizedException(error.message);
    }

    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(dto: OtpDto) {
    const { data, error } = await this.supabase.auth.verifyOtp({
      phone: dto.phone,
      token: dto.otp,
      type: 'sms',
    });

    if (error || !data?.user) {
      this.logger.error(`OTP verify failed`);
      throw new UnauthorizedException('Invalid OTP');
    }

    const { data: clientData } = await this.supabase
      .from('clients')
      .select('*, firms(name)')
      .eq('portal_user_id', data.user.id)
      .maybeSingle();

    if (!clientData) {
      throw new UnauthorizedException('Client not found');
    }

    return {
      access_token: data.session?.access_token,
      user: {
        id: data.user.id,
        role: 'client',
        client_id: clientData.id,
        name: clientData.name,
        firm_name: clientData.firms?.name,
      },
    };
  }

  // ───────────────── REFRESH ─────────────────
  async refreshToken(refreshToken: string) {
    const { data, error } = await this.supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error) {
      this.logger.error(`Refresh failed`);
      throw new UnauthorizedException('Invalid refresh token');
    }

    return {
      access_token: data.session?.access_token,
    };
  }

  // ───────────────── PROFILE ─────────────────
  async getProfile(userId: string) {
    const { data, error } = await this.supabase
      .from('users')
      .select('*, firms(name, logo_url)')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      this.logger.error(`Profile fetch failed`);
      throw new UnauthorizedException('Profile fetch failed');
    }

    return data;
  }
}
