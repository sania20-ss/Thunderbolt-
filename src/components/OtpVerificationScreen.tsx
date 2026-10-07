import React, { useState, useEffect, useRef } from 'react';
import { Mail, CheckCircle2, AlertCircle, RefreshCw, ArrowLeft, KeyRound, ExternalLink, Shield } from 'lucide-react';
import { authApi } from '../services/authApi';
import { emailService } from '../services/emailService';

interface OtpVerificationScreenProps {
  email: string;
  purpose: 'REGISTRATION' | 'LOGIN_2FA' | 'PASSWORD_RESET';
  onSuccess: () => void;
  onBack: () => void;
  onOpenMailbox: () => void;
}

export const OtpVerificationScreen: React.FC<OtpVerificationScreenProps> = ({
  email,
  purpose,
  onSuccess,
  onBack,
  onOpenMailbox,
}) => {
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [successAnimation, setSuccessAnimation] = useState<boolean>(false);
  
  // 5-minute countdown (300 seconds)
  const [timeLeft, setTimeLeft] = useState<number>(300);
  // Resend cooldown (30 seconds)
  const [resendCooldown, setResendCooldown] = useState<number>(30);
  const [resendNotice, setResendNotice] = useState<string>('');

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
      setResendCooldown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-focus first box on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDigitChange = (index: number, val: string) => {
    const cleaned = val.replace(/[^0-9]/g, '');
    const newDigits = [...otpDigits];

    if (cleaned.length > 1) {
      handlePastedCode(cleaned);
      return;
    }

    newDigits[index] = cleaned;
    setOtpDigits(newDigits);
    setErrorMsg('');

    // Advance focus
    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto submit if all 6 digits entered
    if (cleaned && index === 5 && newDigits.every(d => d.length === 1)) {
      triggerVerify(newDigits.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePastedCode = (pasted: string) => {
    const digits = pasted.replace(/[^0-9]/g, '').slice(0, 6).split('');
    if (digits.length === 0) return;

    const newDigits = ['', '', '', '', '', ''];
    digits.forEach((d, i) => {
      if (i < 6) newDigits[i] = d;
    });
    setOtpDigits(newDigits);
    setErrorMsg('');

    if (digits.length === 6) {
      inputRefs.current[5]?.focus();
      triggerVerify(newDigits.join(''));
    } else if (digits.length < 6) {
      inputRefs.current[digits.length]?.focus();
    }
  };

  const triggerVerify = async (fullCode?: string) => {
    const code = fullCode || otpDigits.join('');
    if (code.length !== 6) {
      setErrorMsg('Please enter all 6 digits of the OTP code.');
      return;
    }

    setIsVerifying(true);
    setErrorMsg('');

    try {
      // Call Java Spring Boot REST Endpoint: POST /api/auth/verify-otp
      const result = await authApi.verifyOtp(email, code, purpose);
      setIsVerifying(false);

      setSuccessAnimation(true);
      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch (err: any) {
      setIsVerifying(false);
      setErrorMsg(err.message || 'Verification failed. Please check the code and try again.');
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    setErrorMsg('');
    try {
      // Call Java Spring Boot REST Endpoint: POST /api/auth/resend-otp
      const res = await authApi.resendOtp(email, purpose);
      if (res && (res as any).otpCode) {
        emailService.sendOtpEmail(email, purpose, undefined, (res as any).otpCode);
      }
      setTimeLeft(300);
      setResendCooldown(30);
      setResendNotice('New verification code dispatched via JavaMailSender!');
      setTimeout(() => setResendNotice(''), 6000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to resend code');
    }
  };

  // Find latest OTP for quick fill helper
  const latestOtpMessage = emailService
    .getMessages()
    .find(m => m.to.toLowerCase() === email.toLowerCase() && m.purpose === purpose);

  return (
    <div className="w-full max-w-md mx-auto bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to sign in</span>
      </button>

      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 shadow-inner">
          <Mail className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-white mb-1.5">
          {purpose === 'REGISTRATION'
            ? 'Verify Your Email'
            : purpose === 'LOGIN_2FA'
            ? 'Two-Factor Authentication'
            : 'Reset Password Verification'}
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
          We sent a 6-digit verification code to
        </p>
        <div className="mt-1 font-mono text-xs font-medium text-indigo-300 bg-indigo-950/40 border border-indigo-500/30 rounded-lg py-1 px-3 inline-block">
          {email}
        </div>
      </div>

      {/* Quick Mailbox helper pill */}
      {latestOtpMessage && (
        <div className="mb-6 p-3 bg-slate-800/80 border border-slate-700/80 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <KeyRound className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="truncate">
              <span className="text-slate-400">Incoming code: </span>
              <span className="font-mono font-bold text-amber-300">{latestOtpMessage.otpCode}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handlePastedCode(latestOtpMessage.otpCode)}
            className="px-2.5 py-1 text-[11px] font-medium text-indigo-300 hover:text-white bg-indigo-600/30 hover:bg-indigo-600 border border-indigo-500/40 rounded-md transition-colors shrink-0"
          >
            Auto-fill
          </button>
        </div>
      )}

      {/* 6 Digit Input Group */}
      <div className="mb-6">
        <div className="flex justify-between gap-2 max-w-[340px] mx-auto">
          {otpDigits.map((digit, idx) => (
            <input
              key={idx}
              ref={el => { inputRefs.current[idx] = el; }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              onChange={e => handleDigitChange(idx, e.target.value)}
              onKeyDown={e => handleKeyDown(idx, e)}
              onPaste={e => {
                e.preventDefault();
                handlePastedCode(e.clipboardData.getData('text'));
              }}
              disabled={isVerifying || successAnimation}
              className={`w-11 h-13 sm:w-12 sm:h-14 text-center font-mono text-xl font-bold rounded-xl bg-slate-950/80 border transition-all focus:outline-none focus:ring-2 ${
                successAnimation
                  ? 'border-emerald-500 text-emerald-300 bg-emerald-950/30'
                  : errorMsg
                  ? 'border-rose-500 text-rose-300 focus:ring-rose-500/30'
                  : digit
                  ? 'border-indigo-500 text-white bg-indigo-950/20 focus:ring-indigo-500/40'
                  : 'border-slate-800 text-slate-100 hover:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/30'
              }`}
            />
          ))}
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="flex items-center justify-center gap-1.5 text-xs text-rose-400 mt-3 text-center">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success feedback */}
        {successAnimation && (
          <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-400 mt-3 font-medium animate-bounce">
            <CheckCircle2 className="w-4 h-4" />
            <span>Verified in MySQL! Redirecting...</span>
          </div>
        )}

        {/* Resend notice */}
        {resendNotice && !errorMsg && (
          <div className="text-center text-xs text-indigo-400 mt-2 font-mono">
            {resendNotice}
          </div>
        )}
      </div>

      {/* Verify CTA */}
      <button
        type="button"
        onClick={() => triggerVerify()}
        disabled={isVerifying || successAnimation || otpDigits.some(d => !d)}
        className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 mb-4"
      >
        {isVerifying ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Verifying via Java API...</span>
          </>
        ) : successAnimation ? (
          <>
            <CheckCircle2 className="w-4 h-4" />
            <span>Verified in Java Backend</span>
          </>
        ) : (
          <>
            <Shield className="w-4 h-4" />
            <span>Verify &amp; Activate Account</span>
          </>
        )}
      </button>

      {/* Timer & Resend Controls */}
      <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
        <div className="flex items-center gap-1.5">
          <span>Expires in:</span>
          <span className={`font-mono font-medium ${timeLeft < 60 ? 'text-rose-400 animate-pulse' : 'text-slate-200'}`}>
            {formatTime(timeLeft)}
          </span>
        </div>

        <button
          type="button"
          onClick={handleResend}
          disabled={resendCooldown > 0}
          className="text-xs font-medium text-indigo-400 hover:text-indigo-300 disabled:text-slate-600 disabled:cursor-not-allowed transition-colors"
        >
          {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : 'Resend code'}
        </button>
      </div>

      {/* Software Mailbox link */}
      <div className="mt-4 pt-3 text-center border-t border-slate-800/50">
        <button
          type="button"
          onClick={onOpenMailbox}
          className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
        >
          <span>Check Email in Software Mailbox</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
