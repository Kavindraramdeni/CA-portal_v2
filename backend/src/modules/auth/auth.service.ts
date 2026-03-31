import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../config/supabase.module';
import { LoginDto } from './dto/login.dto';
import { OtpDto } from './dto/otp.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
    private readonly jwtService: JwtService,
  ) {}

  async loginWithPassword(dto: LoginDto) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: dto.email,
      password: dto.password,
    });
    if (error) throw new UnauthorizedException(error.message);

    const { data: userData } = await this.supabase
      .from('users')
      .select('*, firms(*)')
      .eq('id', data.user.id)
      .single();

    if (!userData) throw new UnauthorizedException('User profile not found');
    if (!userData.is_active) throw new UnauthorizedException('Account deactivated');

    return {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
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

  async sendOtp(phone: string) {
    const { error } = await this.supabase.auth.signInWithOtp({ phone });
    if (error) throw new UnauthorizedException(error.message);
    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(dto: OtpDto) {
    const { data, error } = await this.supabase.auth.verifyOtp({
      phone: dto.phone,
      token: dto.otp,
      type: 'sms',
    });
    if (error) throw new UnauthorizedException('Invalid OTP');

    const { data: clientData } = await this.supabase
      .from('clients')
      .select('*, firms(name)')
      .eq('portal_user_id', data.user?.id)
      .single();

    if (!clientData) throw new UnauthorizedException('Client not found');

    return {
      access_token: data.session?.access_token,
      user: {
        id: data.user?.id,
        role: 'client',
        client_id: clientData.id,
        name: clientData.name,
        firm_name: clientData.firms?.name,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    const { data, error } = await this.supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });
    if (error) throw new UnauthorizedException('Invalid refresh token');
    return { access_token: data.session?.access_token };
  }

  async getProfile(userId: string) {
    const { data } = await this.supabase
      .from('users')
      .select('*, firms(name, logo_url)')
      .eq('id', userId)
      .single();
    return data;
  }
}
