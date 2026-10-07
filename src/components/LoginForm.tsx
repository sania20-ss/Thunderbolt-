import React, { useState } from 'react';
import { LogIn, Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight, Zap, RefreshCw } from 'lucide-react';
import { CaptchaBox } from './CaptchaBox';
import { authApi } from '../services/authApi';
import { User, UserRole, AccountStatus } from '../types/auth';
import { emailService } from '../services/emailService';

interface LoginFormProps {
  onLoginSuccess: (user: User) => void;
  onRequireOtp: (email: string, purpose: 'REGISTRATION' | 'LOGIN_2FA') => void;
  onSwitchToRegister: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onLoginSuccess,
  onRequireOtp,
  onSwitchToRegister,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [isCaptchaValid, setIsCaptchaValid] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!identifier.trim()) {
      setErrorMsg('Please enter your email or username.');
      return;
    }

    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    if (!isCaptchaValid || !captchaInput.trim()) {
      setErrorMsg('Please complete the security CAPTCHA verification correctly.');
      return;
    }

    setIsLoading(true);

    try {
      // Connect directly to Java Spring Boot REST Backend
      const response: any = await authApi.login({
        email: identifier.trim(),
        username: identifier.trim(),
        password,
        captchaToken,
        captchaInput: captchaInput.trim(),
      });

      if (response && (response.requires2FA || response.requiresOtp)) {
        const targetEmail = response.email || identifier.trim();
        const purpose = response.requires2FA ? 'LOGIN_2FA' : 'REGISTRATION';
        if (response.otpCode) {
          emailService
            .sendOtpEmail(targetEmail, purpose, undefined, response.otpCode);
        }
        setIsLoading(false);
        onRequireOtp(targetEmail, purpose);
        return;
      }

      if (response && response.email) {
        const loggedUser: User = {
          id: response.id || 1,
          username: response.username || identifier,
          email: response.email,
          firstName: response.firstName || '',
          lastName: response.lastName || '',
          phone: response.phone || '',
          role: (response.role as UserRole) || 'USER',
          department: response.department || '',
          passwordHash: 'PROTECTED_BY_SPRING_BCRYPT',
          salt: 'BCrypt',
          isVerified: response.verified !== false,
          twoFactorEnabled: !!response.twoFactorEnabled,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          status: (response.status as AccountStatus) || 'ACTIVE',
        };

        setIsLoading(false);
        onLoginSuccess(loggedUser);
      } else {
        throw new Error(response.message || 'Authentication failed');
      }
    } catch (err: any) {
      setIsLoading(false);
      const msg = err.message || 'An error occurred during authentication.';

      // If server asks for OTP verification
      if (msg.toLowerCase().includes('otp') || msg.toLowerCase().includes('verify')) {
        onRequireOtp(identifier.trim(), 'REGISTRATION');
      } else {
        setErrorMsg(msg);
      }
    }
  };

  const handleQuickFillDemo = () => {
    setIdentifier('admin@enterprise.io');
    setPassword('Admin@2026!');
    setErrorMsg('');
  };

  return (
    <div className="w-full max-w-md mx-auto bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Welcome Back
          </h2>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Java API Connected
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-400">
          Sign in via Java Spring Boot 3 &amp; BCrypt Authentication
        </p>
      </div>

      {/* Demo Credentials Helper Pill */}
      <div className="mb-5 p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/20 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-indigo-300">
          <Zap className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span>Demo User: <strong>admin@enterprise.io</strong></span>
        </div>
        <button
          type="button"
          onClick={handleQuickFillDemo}
          className="px-2 py-0.5 text-[11px] font-medium text-indigo-200 hover:text-white bg-indigo-600/40 hover:bg-indigo-600 rounded transition-colors"
        >
          Auto-fill
        </button>
      </div>

      {errorMsg && (
        <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Identifier */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Email Address or Username
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              value={identifier}
              onChange={e => {
                setIdentifier(e.target.value);
                setErrorMsg('');
              }}
              placeholder="admin@enterprise.io or username"
              className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-950/80 border border-slate-700/80 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-medium text-slate-300">Password</label>
            <span className="text-[11px] text-slate-400">Demo pwd: Admin@2026!</span>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={e => {
                setPassword(e.target.value);
                setErrorMsg('');
              }}
              placeholder="••••••••••••"
              className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-950/80 border border-slate-700/80 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-slate-500 hover:text-slate-300 absolute right-3 top-1/2 -translate-y-1/2"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Remember me */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-400 hover:text-slate-300">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={e => setRememberMe(e.target.checked)}
              className="w-3.5 h-3.5 rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-indigo-500/20"
            />
            <span>Remember this device</span>
          </label>
        </div>

        {/* Visual CAPTCHA from Java Backend */}
        <div className="pt-2">
          <CaptchaBox
            value={captchaInput}
            onChange={setCaptchaInput}
            onValidChange={setIsCaptchaValid}
            onTokenChange={setCaptchaToken}
            idPrefix="login-captcha"
          />
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading || !isCaptchaValid}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Authenticating with Java API...</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In via Java Backend</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Switch to Register */}
      <div className="mt-6 pt-4 text-center border-t border-slate-800 text-xs text-slate-400">
        <span>Don't have an account yet? </span>
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors ml-1"
        >
          Register New Account
        </button>
      </div>
    </div>
  );
};
