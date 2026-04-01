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

  // Email/password form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // OTP form
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await authApi.login(email, password);
      setAuth(data.user, data.access_token);
      toast.success(`Welcome back, ${data.user.name}!`);
      navigate(data.user.role === 'client' ? '/client/dashboard' : '/admin/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.sendOtp(phone);
      setOtpSent(true);
      toast.success('OTP sent to your WhatsApp');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await authApi.verifyOtp(phone, otp);
      setAuth(data.user, data.access_token);
      toast.success('Logged in successfully!');
      navigate('/client/dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-0 flex items-center justify-center p-4">
      {/* Background grid */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-brand rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow">
            <ShieldCheck size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">CA Portal</h1>
          <p className="text-sm text-text-secondary mt-1">Practice Management System</p>
        </div>

        <div className="card p-6">
          {/* Mode toggle */}
          <div className="flex rounded-lg bg-surface-2 p-1 mb-6">
            <button
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-medium transition-all ${mode === 'email' ? 'bg-surface-3 text-text-primary shadow-sm' : 'text-text-muted hover:text-text-secondary'}`}
              onClick={() => setMode('email')}
            >
              <Mail size={13} /> Staff Login
            </button>
            <button
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-medium transition-all ${mode === 'otp' ? 'bg-surface-3 text-text-primary shadow-sm' : 'text-text-muted hover:text-text-secondary'}`}
              onClick={() => setMode('otp')}
            >
              <Phone size={13} /> Client Login
            </button>
          </div>

          {/* Email login */}
          {mode === 'email' && (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="label">Email address</label>
                <input
                  type="email" className="input" placeholder="admin@cafirm.com"
                  value={email} onChange={e => setEmail(e.target.value)} required
                />
              </div>
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'} className="input pr-10"
                    placeholder="••••••••"
                    value={password} onChange={e => setPassword(e.target.value)} required
                  />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary">
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Sign in'}
              </button>
            </form>
          )}

          {/* OTP login */}
          {mode === 'otp' && (
            <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="space-y-4">
              <div>
                <label className="label">Mobile number</label>
                <input
                  type="tel" className="input" placeholder="+91 98765 43210"
                  value={phone} onChange={e => setPhone(e.target.value)}
                  required disabled={otpSent}
                />
              </div>
              {otpSent && (
                <div className="animate-slide-up">
                  <label className="label">OTP (sent via WhatsApp)</label>
                  <input
                    type="text" className="input tracking-widest text-center text-lg"
                    placeholder="• • • • • •" maxLength={6}
                    value={otp} onChange={e => setOtp(e.target.value)} required
                  />
                </div>
              )}
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? <Loader2 size={16} className="animate-spin" /> :
                  otpSent ? 'Verify OTP' : 'Send OTP'}
              </button>
              {otpSent && (
                <button type="button" onClick={() => { setOtpSent(false); setOtp(''); }}
                  className="w-full text-xs text-text-muted hover:text-text-secondary text-center">
                  Change number
                </button>
              )}
            </form>
          )}

          {/* Demo hint */}
          <div className="mt-5 p-3 rounded-lg bg-surface-2 border border-border">
            <p className="text-xs text-text-muted text-center font-mono">
              Demo: admin@cafirm.com / password123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
  const handleEmailLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
    const data = await authApi.login(email, password);

    console.log('LOGIN RESPONSE:', data);

    // ✅ Set auth FIRST
    setAuth(data.user, data.access_token);

    // ✅ Small delay ensures state persistence
    setTimeout(() => {
      navigate(
        data.user.role === 'client'
          ? '/client/dashboard'
          : '/admin/dashboard'
      );
    }, 100);

  } catch (err) {
    console.error('Login failed', err);
  } finally {
    setLoading(false);
  }
};
};

export default LoginPage;
