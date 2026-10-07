import { EmailMessage } from '../types/auth';

const STORAGE_KEY_EMAILS = 'secureauth_mailbox_messages';

type EmailListener = (email: EmailMessage) => void;

class EmailOtpService {
  private messages: EmailMessage[] = [];
  private listeners: EmailListener[] = [];

  constructor() {
    this.loadMessages();
  }

  private loadMessages() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_EMAILS);
      if (stored) {
        this.messages = JSON.parse(stored);
      }
    } catch {
      this.messages = [];
    }
  }

  private saveMessages() {
    try {
      localStorage.setItem(STORAGE_KEY_EMAILS, JSON.stringify(this.messages));
    } catch {
      // safe fallback
    }
  }

  public subscribe(listener: EmailListener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify(message: EmailMessage) {
    this.listeners.forEach(fn => fn(message));
  }

  public generateOtpCode(): string {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    return code;
  }

  public sendOtpEmail(
    toEmail: string,
    purpose: 'REGISTRATION' | 'LOGIN_2FA' | 'PASSWORD_RESET',
    userName?: string,
    forcedOtpCode?: string
  ): { otpCode: string; message: EmailMessage } {
    const otpCode = forcedOtpCode || this.generateOtpCode();
    const durationMinutes = 5;

    const subjectMap = {
      REGISTRATION: 'Verify your account - Your SecureAuth OTP Code',
      LOGIN_2FA: 'Two-Factor Authentication (2FA) Security Code',
      PASSWORD_RESET: 'Password Reset Request - SecureAuth Verification Code',
    };

    const subject = subjectMap[purpose] || 'Your Verification Code';
    const previewText = `Your one-time verification code is ${otpCode}. Valid for ${durationMinutes} minutes.`;

    const message: EmailMessage = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      to: toEmail.trim(),
      subject,
      purpose,
      otpCode,
      sentAt: new Date().toISOString(),
      expiresAt: Date.now() + durationMinutes * 60 * 1000,
      read: false,
      previewText,
    };

    this.messages.unshift(message);
    if (this.messages.length > 50) this.messages.pop();
    this.saveMessages();
    this.notify(message);

    return { otpCode, message };
  }

  public getMessages(): EmailMessage[] {
    return [...this.messages];
  }

  public markAsRead(id: string) {
    const msg = this.messages.find(m => m.id === id);
    if (msg) {
      msg.read = true;
      this.saveMessages();
    }
  }

  public markAllAsRead() {
    this.messages.forEach(m => (m.read = true));
    this.saveMessages();
  }

  public clearInbox() {
    this.messages = [];
    this.saveMessages();
  }
}

export const emailService = new EmailOtpService();
