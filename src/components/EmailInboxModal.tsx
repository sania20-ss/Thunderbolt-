import React, { useState } from 'react';
import { Mail, X, Check, Copy, Clock, Shield, Trash2, ArrowRight } from 'lucide-react';
import { emailService } from '../services/emailService';
import { EmailMessage } from '../types/auth';

interface EmailInboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAutoFillOtp?: (code: string) => void;
}

export const EmailInboxModal: React.FC<EmailInboxModalProps> = ({
  isOpen,
  onClose,
  onAutoFillOtp,
}) => {
  const messages = emailService.getMessages();
  const [selectedMessage, setSelectedMessage] = useState<EmailMessage | null>(messages[0] || null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelect = (msg: EmailMessage) => {
    setSelectedMessage(msg);
    emailService.markAsRead(msg.id);
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleApply = (code: string) => {
    if (onAutoFillOtp) {
      onAutoFillOtp(code);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl h-[600px] max-h-[90vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Software Transactional Mailbox</h3>
              <p className="text-[11px] text-slate-400">Live incoming OTP verification emails</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {messages.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  emailService.clearInbox();
                  setSelectedMessage(null);
                }}
                className="text-xs text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-1"
                title="Clear all messages"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Content Split View */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Message List Sidebar */}
          <div className="w-full md:w-80 border-r border-slate-800 bg-slate-950/40 overflow-y-auto divide-y divide-slate-800/60">
            {messages.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                <Mail className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                <p>No emails dispatched yet.</p>
                <p className="text-[11px] mt-1 text-slate-600">Register or sign in with 2FA to trigger an OTP email.</p>
              </div>
            ) : (
              messages.map(msg => (
                <button
                  key={msg.id}
                  onClick={() => handleSelect(msg)}
                  className={`w-full text-left p-3.5 transition-colors block ${
                    selectedMessage?.id === msg.id
                      ? 'bg-indigo-600/15 border-l-2 border-indigo-500'
                      : 'hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-mono text-indigo-300 font-semibold truncate max-w-[140px]">
                      {msg.to}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap">
                      {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-xs font-medium text-white truncate mb-1">
                    {msg.subject}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-mono">
                      OTP: <strong className="text-amber-300">{msg.otpCode}</strong>
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                      {msg.purpose}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Email Preview Pane */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-900/60">
            {selectedMessage ? (
              <div className="max-w-xl mx-auto space-y-6">
                {/* Email metadata header */}
                <div className="border-b border-slate-800 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-base font-bold text-white mb-2">
                        {selectedMessage.subject}
                      </h4>
                      <div className="space-y-1 text-xs">
                        <div className="text-slate-400">
                          <span className="text-slate-500">From: </span>
                          <span className="text-slate-200">SecureAuth Identity System &lt;no-reply@secureauth.enterprise&gt;</span>
                        </div>
                        <div className="text-slate-400">
                          <span className="text-slate-500">To: </span>
                          <span className="text-indigo-300 font-mono">{selectedMessage.to}</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-slate-500 font-mono whitespace-nowrap">
                      {new Date(selectedMessage.sentAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Rendered HTML Body */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 text-slate-300 text-xs sm:text-sm space-y-5">
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                    <Shield className="w-5 h-5 text-indigo-400" />
                    <span className="font-bold text-white tracking-wide">SECUREAUTH VERIFICATION</span>
                  </div>

                  <p className="text-slate-300 leading-relaxed">
                    Hello,
                  </p>
                  <p className="text-slate-300 leading-relaxed">
                    You recently requested an authentication verification code for your enterprise account. Please enter the one-time security passcode below:
                  </p>

                  {/* Highlighted OTP Box */}
                  <div className="my-6 p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-center">
                    <span className="text-[11px] font-mono text-indigo-300 uppercase tracking-wider block mb-1">
                      One-Time Passcode (OTP)
                    </span>
                    <div className="text-3xl sm:text-4xl font-mono font-bold tracking-widest text-white my-2 select-all">
                      {selectedMessage.otpCode}
                    </div>
                    <div className="flex items-center justify-center gap-1.5 text-xs text-amber-300 mt-2 font-mono">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Valid for 5 minutes</span>
                    </div>

                    {/* Action buttons inside email */}
                    <div className="flex items-center justify-center gap-3 mt-4 pt-3 border-t border-indigo-500/20">
                      <button
                        type="button"
                        onClick={() => handleCopy(selectedMessage.otpCode)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-medium text-slate-200 transition-colors flex items-center gap-1.5"
                      >
                        {copiedCode === selectedMessage.otpCode ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Code</span>
                          </>
                        )}
                      </button>

                      {onAutoFillOtp && (
                        <button
                          type="button"
                          onClick={() => handleApply(selectedMessage.otpCode)}
                          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
                        >
                          <span>Auto-fill in Screen</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-slate-400 text-xs leading-relaxed">
                    If you did not request this verification code, please disregard this email or notify your system administrator immediately.
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Select an email from the left sidebar to read its content.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
