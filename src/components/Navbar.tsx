import React from 'react';
import { Mail, Database, Code2, Shield, LogOut, User as UserIcon } from 'lucide-react';
import { User } from '../types/auth';

interface NavbarProps {
  currentView: 'auth' | 'mysql' | 'java';
  onViewChange: (view: 'auth' | 'mysql' | 'java') => void;
  currentUser: User | null;
  onLogout: () => void;
  onOpenInbox: () => void;
  unreadEmailCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onViewChange,
  currentUser,
  onLogout,
  onOpenInbox,
  unreadEmailCount,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand title wordmark */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onViewChange('auth')}
            className="flex items-center gap-2.5 text-left group transition-transform focus:outline-none"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
              <Shield className="w-4 h-4" />
            </div>
            <span className="text-base font-bold tracking-tight text-white group-hover:text-indigo-200 transition-colors">
              SecureAuth
            </span>
          </button>
        </div>

        {/* Zone 2: 4 clean navigation links */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => onViewChange('auth')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              currentView === 'auth'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Auth Portal
          </button>

          <button
            onClick={onOpenInbox}
            className="relative px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5"
          >
            <Mail className="w-3.5 h-3.5 text-indigo-400" />
            <span>Email OTP Inbox</span>
            {unreadEmailCount > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] font-mono bg-indigo-600 text-white rounded-full">
                {unreadEmailCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onViewChange('mysql')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              currentView === 'mysql'
                ? 'bg-sky-600/20 text-sky-300 border border-sky-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-sky-400" />
            <span>MySQL Studio</span>
          </button>

          <button
            onClick={() => onViewChange('java')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              currentView === 'java'
                ? 'bg-amber-600/20 text-amber-300 border border-amber-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Java Backend</span>
          </button>
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-2.5">
          {currentUser ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                <div className="w-5 h-5 rounded-full bg-indigo-600 text-[10px] font-bold flex items-center justify-center text-white">
                  {currentUser.firstName[0]}
                </div>
                <span className="font-medium text-slate-200 truncate max-w-[100px]">
                  {currentUser.firstName}
                </span>
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <span className="text-[11px] text-slate-400 font-mono hidden md:inline">
              MySQL 8.0 · Java Spring · Email OTP
            </span>
          )}
        </div>
      </div>
    </header>
  );
};
