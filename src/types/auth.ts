export type UserRole = 'ADMIN' | 'DEVELOPER' | 'MANAGER' | 'USER';
export type AccountStatus = 'ACTIVE' | 'PENDING_OTP' | 'SUSPENDED';

export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: UserRole;
  department: string;
  passwordHash: string;
  salt: string;
  isVerified: boolean;
  twoFactorEnabled: boolean;
  avatarUrl?: string;
  bio?: string;
  createdAt: string;
  lastLoginAt?: string;
  status: AccountStatus;
}

export interface OtpRecord {
  id: number;
  email: string;
  otpCode: string;
  purpose: 'REGISTRATION' | 'LOGIN_2FA' | 'PASSWORD_RESET';
  expiresAt: number; // timestamp in ms
  attempts: number;
  verified: boolean;
  createdAt: string;
}

export interface CaptchaData {
  token: string;
  solution: string;
  expiresAt: number;
}

export interface SecurityAuditLog {
  id: number;
  userId?: number;
  email: string;
  action: 
    | 'USER_REGISTER_INITIATED' 
    | 'OTP_DISPATCHED' 
    | 'OTP_VERIFICATION_SUCCESS' 
    | 'OTP_VERIFICATION_FAILED' 
    | 'LOGIN_SUCCESS' 
    | 'LOGIN_FAILED' 
    | 'LOGOUT' 
    | 'PASSWORD_CHANGED' 
    | 'TWO_FACTOR_TOGGLED'
    | 'PROFILE_UPDATED';
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  status: 'SUCCESS' | 'FAILURE' | 'WARNING';
  details: string;
}

export interface EmailMessage {
  id: string;
  to: string;
  subject: string;
  purpose: 'REGISTRATION' | 'LOGIN_2FA' | 'PASSWORD_RESET';
  otpCode: string;
  sentAt: string;
  expiresAt: number;
  read: boolean;
  previewText: string;
}

export interface MysqlColumn {
  field: string;
  type: string;
  null: 'YES' | 'NO';
  key: 'PRI' | 'UNI' | 'MUL' | '';
  default: string | null;
  extra: string;
}

export interface MysqlTable {
  name: string;
  description: string;
  columns: MysqlColumn[];
  rowCount: number;
}
