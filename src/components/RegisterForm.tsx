import React, { useState } from 'react';
import { UserPlus, Mail, Lock, User, Phone, Briefcase, Eye, EyeOff, AlertCircle, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';
import { CaptchaBox } from './CaptchaBox';
import { authApi } from '../services/authApi';
import { UserRole } from '../types/auth';
import { emailService } from '../services/emailService';

interface RegisterFormProps {
  onSuccess: (email: string) => void;
  onSwitchToLogin: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    phone: '',
    role: 'DEVELOPER' as UserRole,
    department: 'Software Engineering',
    password: '',
    confirmPassword: '',
  });

  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [isCaptchaValid, setIsCaptchaValid] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Password strength checks
  const hasMinLen = formData.password.length >= 8;
  const hasUpper = /[A-Z]/.test(formData.password);
  const hasLower = /[a-z]/.test(formData.password);
  const hasNumber = /[0-9]/.test(formData.password);
  const hasSpecial = /[^A-Za-z0-9]/.test(formData.password);
  const strengthScore = [hasMinLen, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;

  const handleInputChange = (field: string, val: string) => {
    setFormData(prev => ({ ...prev, [field]: val }));
    setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Field validations
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setErrorMsg('Please enter both first and last name.');
      return;
    }

    if (!formData.username.trim() || formData.username.trim().length < 3) {
      setErrorMsg('Username must be at least 3 characters.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      setErrorMsg('Please provide a valid corporate or personal email address.');
      return;
    }

    // Password validation
    if (strengthScore < 3) {
      setErrorMsg('Password must satisfy at least 3 of the security criteria.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    // CAPTCHA verification
    if (!isCaptchaValid || !captchaInput.trim()) {
      setErrorMsg('Security CAPTCHA verification required. Please enter the characters shown.');
      return;
    }

    setIsLoading(true);

    try {
      // Connect directly to Java Spring Boot REST Backend
      const res = await authApi.register({
        username: formData.username.trim(),
        email: formData.email.trim().toLowerCase(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim(),
        role: formData.role,
        department: formData.department.trim(),
        password: formData.password,
        captchaToken,
        captchaInput: captchaInput.trim(),
      });

      if (res && (res as any).otpCode) {
        emailService.sendOtpEmail(
          formData.email.trim().toLowerCase(),
          'REGISTRATION',
          `${formData.firstName} ${formData.lastName}`,
          (res as any).otpCode
        );
      }

      setIsLoading(false);
      onSuccess(formData.email.trim().toLowerCase());
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err.message || 'Failed to complete registration.');
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Create Software Account
          </h2>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Java API Connected
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-400">
          Register credentials directly to Java Spring Boot &amp; MySQL
        </p>
      </div>

      {errorMsg && (
        <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name Fields (2 col) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">First Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={e => handleInputChange('firstName', e.target.value)}
                placeholder="Jane"
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-950/80 border border-slate-700/80 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Last Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={e => handleInputChange('lastName', e.target.value)}
                placeholder="Doe"
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-950/80 border border-slate-700/80 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>
        </div>

        {/* Username & Email (2 col) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Username</label>
            <input
              type="text"
              required
              value={formData.username}
              onChange={e => handleInputChange('username', e.target.value)}
              placeholder="jdoe2026"
              className="w-full px-3 py-2 text-sm bg-slate-950/80 border border-slate-700/80 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={e => handleInputChange('email', e.target.value)}
                placeholder="jane.doe@enterprise.io"
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-950/80 border border-slate-700/80 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>
        </div>

        {/* Phone & Role */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                value={formData.phone}
                onChange={e => handleInputChange('phone', e.target.value)}
                placeholder="+1 (555) 019-2834"
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-950/80 border border-slate-700/80 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Enterprise Role</label>
            <div className="relative">
              <Briefcase className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={formData.role}
                onChange={e => handleInputChange('role', e.target.value as UserRole)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-950/80 border border-slate-700/80 rounded-lg text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="DEVELOPER">DEVELOPER</option>
                <option value="ADMIN">ADMIN</option>
                <option value="MANAGER">MANAGER</option>
                <option value="USER">STANDARD USER</option>
              </select>
            </div>
          </div>
        </div>

        {/* Department */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Department</label>
          <input
            type="text"
            value={formData.department}
            onChange={e => handleInputChange('department', e.target.value)}
            placeholder="Cybersecurity Operations"
            className="w-full px-3 py-2 text-sm bg-slate-950/80 border border-slate-700/80 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        {/* Password & Confirm (2 col) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={e => handleInputChange('password', e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-9 py-2 text-sm bg-slate-950/80 border border-slate-700/80 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
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
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Confirm Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={formData.confirmPassword}
                onChange={e => handleInputChange('confirmPassword', e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-9 py-2 text-sm bg-slate-950/80 border border-slate-700/80 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="text-slate-500 hover:text-slate-300 absolute right-3 top-1/2 -translate-y-1/2"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Password Strength Indicator */}
        {formData.password && (
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span>Password Security:</span>
              <span className={`font-semibold ${strengthScore >= 4 ? 'text-emerald-400' : strengthScore >= 3 ? 'text-amber-400' : 'text-rose-400'
                }`}>
                {strengthScore >= 4 ? 'High Security' : strengthScore >= 3 ? 'Medium Security' : 'Weak Security'}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {[1, 2, 3, 4, 5].map(step => (
                <div
                  key={step}
                  className={`h-1.5 rounded-full transition-colors ${step <= strengthScore
                      ? strengthScore >= 4
                        ? 'bg-emerald-500'
                        : strengthScore >= 3
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      : 'bg-slate-800'
                    }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Visual CAPTCHA from Java Backend */}
        <div className="pt-2">
          <CaptchaBox
            value={captchaInput}
            onChange={setCaptchaInput}
            onValidChange={setIsCaptchaValid}
            onTokenChange={setCaptchaToken}
            idPrefix="reg-captcha"
          />
        </div>

        {/* Submit button */}
        <div className="pt-3">
          <button
            type="submit"
            disabled={isLoading || !isCaptchaValid}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Registering via Java Backend...</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Register &amp; Dispatch Email OTP</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Switch to Login */}
      <div className="mt-6 pt-4 text-center border-t border-slate-800 text-xs text-slate-400">
        <span>Already have an account? </span>
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors ml-1"
        >
          Sign In Here
        </button>
      </div>
    </div>
  );
};
