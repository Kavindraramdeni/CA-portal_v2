import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Eye, EyeOff, Loader2, Phone, Mail } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { authApi } from '../../services/api';
import toast from 'react-hot-toast';

type Mode = 'email' | 'otp';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const [mode, setMode] = useState<Mode>('email');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');

  // ✅ EMAIL LOGIN
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await authApi.login(email, password);

      console.log('LOGIN RESPONSE:', data);

      setAuth(data.user, data.access_token);

      toast.success(`Welcome back, ${data.user.name}!`);

      // ✅ delay to ensure state is saved
      setTimeout(() => {
        navigate(
          data.user.role === 'client'
            ? '/client/dashboard'
            : '/admin/dashboard'
        );
      }, 100);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ SEND OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.sendOtp(phone);
      setOtpSent(true);
      toast.success('OTP sent');
    } finally {
      setLoading(false);
    }
  };

  // ✅ VERIFY OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await authApi.verifyOtp(phone, otp);
      setAuth(data.user, data.access_token);
      navigate('/client/dashboard');
    } finally {
      setLoading(false);
    }
  };

  // ✅ UI STARTS HERE (AFTER ALL FUNCTIONS)
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-sm">

        <h1 className="text-xl font-bold text-center mb-4">CA Portal</h1>

        {/* Mode toggle */}
        <div className="flex mb-4">
          <button onClick={() => setMode('email')}>Email</button>
          <button onClick={() => setMode('otp')}>OTP</button>
        </div>

        {/* EMAIL LOGIN */}
        {mode === 'email' && (
          <form onSubmit={handleEmailLogin}>
            <input
              type="email"
              placeholder="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <input
              type={showPwd ? 'text' : 'password'}
              placeholder="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button type="submit" disabled={loading}>
              {loading ? 'Loading...' : 'Login'}
            </button>
          </form>
        )}

        {/* OTP LOGIN */}
        {mode === 'otp' && (
          <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp}>
            <input
              type="tel"
              placeholder="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            {otpSent && (
              <input
                type="text"
                placeholder="OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
            )}

            <button type="submit">
              {otpSent ? 'Verify OTP' : 'Send OTP'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};

export default LoginPage;
