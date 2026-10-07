import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import { OtpVerificationScreen } from './components/OtpVerificationScreen';
import { UserDashboard } from './components/UserDashboard';
import { MysqlStudio } from './components/MysqlStudio';
import { JavaBackendStudio } from './components/JavaBackendStudio';
import { EmailInboxModal } from './components/EmailInboxModal';
import { emailService } from './services/emailService';
import { dbService } from './services/db';
import { User, EmailMessage } from './types/auth';
import { Shield, KeyRound, Database, Code2, Mail, ExternalLink, CheckCircle2, Sparkles } from 'lucide-react';

const STORAGE_KEY_AUTH_USER = 'secureauth_current_logged_in_user';

export default function App() {
  const [currentView, setCurrentView] = useState<'auth' | 'mysql' | 'java'>('auth');
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'otp'>('login');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // OTP flow state
  const [otpEmail, setOtpEmail] = useState<string>('');
  const [otpPurpose, setOtpPurpose] = useState<'REGISTRATION' | 'LOGIN_2FA' | 'PASSWORD_RESET'>('REGISTRATION');

  // Mailbox modal
  const [isInboxOpen, setIsInboxOpen] = useState<boolean>(false);
  const [unreadEmails, setUnreadEmails] = useState<number>(0);

  // Incoming email toast notification
  const [emailToast, setEmailToast] = useState<EmailMessage | null>(null);

  // Load active session from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_AUTH_USER);
      if (stored) {
        const u = JSON.parse(stored);
        // Refresh from DB
        const fresh = dbService.findUserById(u.id);
        if (fresh) {
          setCurrentUser(fresh);
        }
      }
    } catch (e) {
      console.warn('Session load error', e);
    }
  }, []);

  // Listen to new emails dispatched by the software
  useEffect(() => {
    const updateUnread = () => {
      const msgs = emailService.getMessages();
      setUnreadEmails(msgs.filter(m => !m.read).length);
    };

    updateUnread();

    const unsubscribe = emailService.subscribe((newMsg) => {
      updateUnread();
      setEmailToast(newMsg);
      // Auto-hide toast after 8 seconds
      setTimeout(() => {
        setEmailToast(null);
      }, 8000);
    });

    return () => unsubscribe();
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(user));
  };

  const handleLogout = () => {
    if (currentUser) {
      dbService.logAction('LOGOUT', currentUser.email, 'SUCCESS', 'User logged out of session.', currentUser.id);
    }
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEY_AUTH_USER);
    setAuthMode('login');
  };

  const handleRegisterSuccess = (email: string) => {
    setOtpEmail(email);
    setOtpPurpose('REGISTRATION');
    setAuthMode('otp');
  };

  const handleRequireOtp = (email: string, purpose: 'REGISTRATION' | 'LOGIN_2FA') => {
    setOtpEmail(email);
    setOtpPurpose(purpose);
    setAuthMode('otp');
  };

  const handleOtpSuccess = () => {
    const user = dbService.findUserByEmail(otpEmail);
    if (user) {
      handleLoginSuccess(user);
    } else {
      setAuthMode('login');
    }
  };

  const handleUserUpdated = (updated: User) => {
    setCurrentUser(updated);
    localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(updated));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Bar Navigation */}
      <Navbar
        currentView={currentView}
        onViewChange={setCurrentView}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenInbox={() => setIsInboxOpen(true)}
        unreadEmailCount={unreadEmails}
      />

      {/* Real-time Email Toast Banner */}
      {emailToast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full animate-in slide-in-from-bottom-5 fade-in">
          <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-md flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-indigo-300 font-semibold uppercase">
                  Email OTP Dispatched
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Just now</span>
              </div>
              <p className="text-xs text-white font-medium truncate mt-0.5">
                Code for {emailToast.to}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs font-mono font-bold text-amber-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  {emailToast.otpCode}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsInboxOpen(true);
                    setEmailToast(null);
                  }}
                  className="text-xs text-indigo-300 hover:text-white font-medium flex items-center gap-1 transition-colors"
                >
                  <span>Open Email</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
            <button
              onClick={() => setEmailToast(null)}
              className="text-slate-500 hover:text-white text-xs p-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* VIEW 1: AUTHENTICATION PORTAL */}
        {currentView === 'auth' && (
          <div className="space-y-8">
            {currentUser ? (
              <UserDashboard
                currentUser={currentUser}
                onLogout={handleLogout}
                onUserUpdated={handleUserUpdated}
                onOpenMysqlStudio={() => setCurrentView('mysql')}
                onOpenJavaStudio={() => setCurrentView('java')}
              />
            ) : (
              <div className="space-y-8">
                {/* Architecture Highlights Bar */}
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 backdrop-blur-sm">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-xs">
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-semibold text-white block">Email OTP</span>
                        <span className="text-[11px] text-slate-400">Transactional 6-digit codes</span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 shrink-0">
                        <Shield className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-semibold text-white block">Visual CAPTCHA</span>
                        <span className="text-[11px] text-slate-400">Distortion &amp; audio readout</span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
                        <Database className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-semibold text-white block">MySQL Database</span>
                        <span className="text-[11px] text-slate-400">auth_db connection pool</span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                        <Code2 className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-semibold text-white block">Java Backend</span>
                        <span className="text-[11px] text-slate-400">Spring Boot REST &amp; JPA</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sub-view switcher for unauthenticated states */}
                <div className="flex justify-center">
                  <div className="p-1 bg-slate-900 border border-slate-800 rounded-xl inline-flex gap-1">
                    <button
                      type="button"
                      onClick={() => setAuthMode('login')}
                      className={`px-5 py-2 text-xs font-semibold rounded-lg transition-colors ${
                        authMode === 'login'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthMode('register')}
                      className={`px-5 py-2 text-xs font-semibold rounded-lg transition-colors ${
                        authMode === 'register'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Register Account
                    </button>
                  </div>
                </div>

                {/* Auth Form Render */}
                <div>
                  {authMode === 'login' && (
                    <LoginForm
                      onLoginSuccess={handleLoginSuccess}
                      onRequireOtp={handleRequireOtp}
                      onSwitchToRegister={() => setAuthMode('register')}
                    />
                  )}

                  {authMode === 'register' && (
                    <RegisterForm
                      onSuccess={handleRegisterSuccess}
                      onSwitchToLogin={() => setAuthMode('login')}
                    />
                  )}

                  {authMode === 'otp' && (
                    <OtpVerificationScreen
                      email={otpEmail}
                      purpose={otpPurpose}
                      onSuccess={handleOtpSuccess}
                      onBack={() => setAuthMode('login')}
                      onOpenMailbox={() => setIsInboxOpen(true)}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: MYSQL DATABASE STUDIO */}
        {currentView === 'mysql' && <MysqlStudio />}

        {/* VIEW 3: JAVA BACKEND STUDIO */}
        {currentView === 'java' && <JavaBackendStudio />}
      </main>

      {/* Modal: Transactional Email Inbox */}
      <EmailInboxModal
        isOpen={isInboxOpen}
        onClose={() => setIsInboxOpen(false)}
        onAutoFillOtp={(code) => {
          // If user is currently in OTP mode, this will automatically fill
          if (authMode === 'otp') {
            // Trigger auto fill
            const inputs = document.querySelectorAll('input[pattern="[0-9]*"]');
            if (inputs.length === 6) {
              code.split('').forEach((digit, i) => {
                const el = inputs[i] as HTMLInputElement;
                if (el) {
                  el.value = digit;
                  el.dispatchEvent(new Event('input', { bubbles: true }));
                }
              });
            }
          }
        }}
      />

      {/* Clean quiet footer compliant with anti-slop rules */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500 font-mono">
        SecureAuth Enterprise System · React Frontend · Java Spring Boot Architecture · MySQL Persistence
      </footer>
    </div>
  );
}
