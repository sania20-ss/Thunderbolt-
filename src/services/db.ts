import { User, OtpRecord, SecurityAuditLog, MysqlTable, MysqlColumn } from '../types/auth';

// ============================================================================
// LOCAL STORAGE DATABASE STATE (COMMENTED OUT)
// The application is now directly connected to the Java Spring Boot Backend API
// (http://localhost:8080/api/auth) backed by MySQL database persistence.
// ============================================================================

/*
const STORAGE_KEY_USERS = 'secureauth_mysql_users';
const STORAGE_KEY_OTPS = 'secureauth_mysql_otps';
const STORAGE_KEY_LOGS = 'secureauth_mysql_logs';
*/

// Simple SHA-256 simulation for demonstration password hashing
export async function hashPassword(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(password + salt + 'SECURE_AUTH_SALT_V1');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function generateSalt(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Initial seed users representation for MySQL Studio Inspector
const INITIAL_USERS: User[] = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@enterprise.io',
    firstName: 'Marcus',
    lastName: 'Vance',
    phone: '+1 (555) 349-8821',
    role: 'ADMIN',
    department: 'Cybersecurity Operations',
    passwordHash: '$2a$10$e8wFhJ0xY7gQ8B9V1Z3X8uK5s9.x8fJ9a1.0Z1X3Y5b7c9e1g3i5', // BCrypt
    salt: 'BCrypt',
    isVerified: true,
    twoFactorEnabled: false,
    avatarUrl: '',
    bio: 'Enterprise Security Architect and Systems Lead.',
    createdAt: '2026-01-15T09:30:00.000Z',
    lastLoginAt: '2026-10-07T08:15:22.000Z',
    status: 'ACTIVE',
  },
  {
    id: 2,
    username: 'dev_sarah',
    email: 'sarah.connor@enterprise.io',
    firstName: 'Sarah',
    lastName: 'Connor',
    phone: '+1 (555) 892-1204',
    role: 'DEVELOPER',
    department: 'Cloud Infrastructure',
    passwordHash: '$2a$10$e8wFhJ0xY7gQ8B9V1Z3X8uK5s9.x8fJ9a1.0Z1X3Y5b7c9e1g3i5',
    salt: 'BCrypt',
    isVerified: true,
    twoFactorEnabled: true,
    avatarUrl: '',
    bio: 'Senior Backend Engineer specialized in Java Spring Boot & distributed DBs.',
    createdAt: '2026-03-20T11:45:00.000Z',
    lastLoginAt: '2026-10-06T14:20:10.000Z',
    status: 'ACTIVE',
  }
];

class MysqlDatabaseService {
  private users: User[] = [...INITIAL_USERS];
  private otps: OtpRecord[] = [];
  private logs: SecurityAuditLog[] = [];
  private nextUserId = 3;
  private nextOtpId = 1;
  private nextLogId = 1;

  constructor() {
    this.loadState();
  }

  private loadState() {
    // =========================================================================
    // LOCAL STORAGE DB LOADING - COMMENTED OUT
    // All persistence is now routed to Java Backend (Spring Data JPA + MySQL)
    // =========================================================================
    /*
    try {
      const storedUsers = localStorage.getItem(STORAGE_KEY_USERS);
      if (storedUsers) {
        this.users = JSON.parse(storedUsers);
        this.nextUserId = Math.max(...this.users.map(u => u.id), 0) + 1;
      } else {
        this.users = [...INITIAL_USERS];
        this.saveUsers();
      }

      const storedOtps = localStorage.getItem(STORAGE_KEY_OTPS);
      if (storedOtps) {
        this.otps = JSON.parse(storedOtps);
        this.nextOtpId = Math.max(...this.otps.map(o => o.id), 0) + 1;
      }

      const storedLogs = localStorage.getItem(STORAGE_KEY_LOGS);
      if (storedLogs) {
        this.logs = JSON.parse(storedLogs);
        this.nextLogId = Math.max(...this.logs.map(l => l.id), 0) + 1;
      } else {
        this.logAction(
          'USER_REGISTER_INITIATED',
          'SYSTEM',
          'SUCCESS',
          'MySQL Database initialized with primary enterprise tables: users, email_otps, security_audit_logs.'
        );
      }
    } catch (e) {
      console.warn('Failed to parse database state from localStorage', e);
      this.users = [...INITIAL_USERS];
    }
    */
    this.users = [...INITIAL_USERS];
  }

  private saveUsers() {
    // =========================================================================
    // LOCAL STORAGE DB SAVING - COMMENTED OUT
    // =========================================================================
    // localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(this.users));
  }

  private saveOtps() {
    // =========================================================================
    // LOCAL STORAGE DB SAVING - COMMENTED OUT
    // =========================================================================
    // localStorage.setItem(STORAGE_KEY_OTPS, JSON.stringify(this.otps));
  }

  private saveLogs() {
    // =========================================================================
    // LOCAL STORAGE DB SAVING - COMMENTED OUT
    // =========================================================================
    // localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(this.logs));
  }

  // --- Users CRUD ---
  public getUsers(): User[] {
    return [...this.users];
  }

  public findUserByEmail(email: string): User | undefined {
    return this.users.find(u => u.email.trim().toLowerCase() === email.trim().toLowerCase());
  }

  public findUserByUsername(username: string): User | undefined {
    return this.users.find(u => u.username.trim().toLowerCase() === username.trim().toLowerCase());
  }

  public findUserById(id: number): User | undefined {
    return this.users.find(u => u.id === id);
  }

  public async registerUser(userData: {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    role: User['role'];
    department: string;
    passwordPlain: string;
  }): Promise<{ user: User; salt: string }> {
    const salt = generateSalt();
    const passwordHash = await hashPassword(userData.passwordPlain, salt);

    const newUser: User = {
      id: this.nextUserId++,
      username: userData.username.trim(),
      email: userData.email.trim().toLowerCase(),
      firstName: userData.firstName.trim(),
      lastName: userData.lastName.trim(),
      phone: userData.phone.trim(),
      role: userData.role,
      department: userData.department.trim(),
      passwordHash,
      salt,
      isVerified: false,
      twoFactorEnabled: false,
      createdAt: new Date().toISOString(),
      status: 'PENDING_OTP',
    };

    this.users.push(newUser);
    this.saveUsers();

    this.logAction(
      'USER_REGISTER_INITIATED',
      newUser.email,
      'SUCCESS',
      `New user account created with status PENDING_OTP (User ID: ${newUser.id}, Role: ${newUser.role})`
    );

    return { user: newUser, salt };
  }

  public updateUser(id: number, updates: Partial<User>): User | null {
    const idx = this.users.findIndex(u => u.id === id);
    if (idx === -1) return null;

    this.users[idx] = { ...this.users[idx], ...updates };
    this.saveUsers();
    return this.users[idx];
  }

  public markUserVerified(email: string): boolean {
    const user = this.findUserByEmail(email);
    if (!user) return false;

    user.isVerified = true;
    user.status = 'ACTIVE';
    this.saveUsers();

    this.logAction(
      'OTP_VERIFICATION_SUCCESS',
      email,
      'SUCCESS',
      `User account verified via email OTP and activated in MySQL (ID: ${user.id}).`
    );
    return true;
  }

  public deleteUser(id: number): boolean {
    const initialLen = this.users.length;
    this.users = this.users.filter(u => u.id !== id);
    if (this.users.length !== initialLen) {
      this.saveUsers();
      return true;
    }
    return false;
  }

  // --- OTP Management ---
  public createOtp(
    email: string,
    otpCode: string,
    purpose: OtpRecord['purpose'] = 'REGISTRATION',
    durationMinutes = 5
  ): OtpRecord {
    this.otps.forEach(o => {
      if (o.email.toLowerCase() === email.toLowerCase() && o.purpose === purpose && !o.verified) {
        o.expiresAt = Date.now() - 1000;
      }
    });

    const record: OtpRecord = {
      id: this.nextOtpId++,
      email: email.trim().toLowerCase(),
      otpCode,
      purpose,
      expiresAt: Date.now() + durationMinutes * 60 * 1000,
      attempts: 0,
      verified: false,
      createdAt: new Date().toISOString(),
    };

    this.otps.push(record);
    this.saveOtps();

    this.logAction(
      'OTP_DISPATCHED',
      email,
      'SUCCESS',
      `Generated 6-digit OTP for ${purpose}. Expires in ${durationMinutes} mins.`
    );

    return record;
  }

  public verifyOtp(
    email: string,
    otpCode: string,
    purpose: OtpRecord['purpose']
  ): { success: boolean; message: string } {
    const normalizedEmail = email.trim().toLowerCase();
    const record = this.otps
      .filter(o => o.email.toLowerCase() === normalizedEmail && o.purpose === purpose)
      .sort((a, b) => b.id - a.id)[0];

    if (!record) {
      this.logAction('OTP_VERIFICATION_FAILED', email, 'FAILURE', 'No active OTP found for this email.');
      return { success: false, message: 'No OTP verification request found. Please request a new code.' };
    }

    if (record.verified) {
      return { success: false, message: 'This OTP has already been verified and consumed.' };
    }

    if (Date.now() > record.expiresAt) {
      this.logAction('OTP_VERIFICATION_FAILED', email, 'WARNING', 'OTP code has expired.');
      return { success: false, message: 'OTP has expired (valid for 5 minutes). Please click Resend OTP.' };
    }

    if (record.attempts >= 5) {
      this.logAction('OTP_VERIFICATION_FAILED', email, 'FAILURE', 'Max OTP attempts reached.');
      return { success: false, message: 'Maximum attempts (5) reached. Please request a new OTP code.' };
    }

    record.attempts += 1;

    if (record.otpCode !== otpCode.trim()) {
      this.saveOtps();
      this.logAction(
        'OTP_VERIFICATION_FAILED',
        email,
        'FAILURE',
        `Incorrect OTP submitted. Attempt ${record.attempts}/5.`
      );
      return {
        success: false,
        message: `Invalid verification code. ${5 - record.attempts} attempts remaining.`
      };
    }

    record.verified = true;
    this.saveOtps();

    if (purpose === 'REGISTRATION') {
      this.markUserVerified(email);
    }

    return { success: true, message: 'OTP verified successfully.' };
  }

  public getOtps(): OtpRecord[] {
    return [...this.otps];
  }

  // --- Audit Logs ---
  public logAction(
    action: SecurityAuditLog['action'],
    email: string,
    status: SecurityAuditLog['status'],
    details: string,
    userId?: number
  ) {
    const log: SecurityAuditLog = {
      id: this.nextLogId++,
      userId,
      email,
      action,
      ipAddress: '127.0.0.1',
      userAgent: navigator.userAgent.split(' ')[0] || 'Mozilla/5.0',
      timestamp: new Date().toISOString(),
      status,
      details,
    };
    this.logs.unshift(log);
    if (this.logs.length > 200) this.logs.pop();
    this.saveLogs();
  }

  public getLogs(): SecurityAuditLog[] {
    return [...this.logs];
  }

  // --- MySQL Metadata & Tables Inspector ---
  public getTableDefinitions(): MysqlTable[] {
    return [
      {
        name: 'users',
        description: 'Core user credentials, profiles, status, and role metadata',
        rowCount: this.users.length,
        columns: [
          { field: 'id', type: 'BIGINT AUTO_INCREMENT', null: 'NO', key: 'PRI', default: null, extra: 'auto_increment' },
          { field: 'username', type: 'VARCHAR(50)', null: 'NO', key: 'UNI', default: null, extra: '' },
          { field: 'email', type: 'VARCHAR(100)', null: 'NO', key: 'UNI', default: null, extra: '' },
          { field: 'first_name', type: 'VARCHAR(50)', null: 'NO', key: '', default: null, extra: '' },
          { field: 'last_name', type: 'VARCHAR(50)', null: 'NO', key: '', default: null, extra: '' },
          { field: 'phone', type: 'VARCHAR(25)', null: 'YES', key: '', default: null, extra: '' },
          { field: 'role', type: "ENUM('ADMIN','DEVELOPER','MANAGER','USER')", null: 'NO', key: '', default: "'USER'", extra: '' },
          { field: 'department', type: 'VARCHAR(100)', null: 'YES', key: '', default: null, extra: '' },
          { field: 'password_hash', type: 'VARCHAR(255)', null: 'NO', key: '', default: null, extra: '' },
          { field: 'salt', type: 'VARCHAR(64)', null: 'NO', key: '', default: null, extra: '' },
          { field: 'is_verified', type: 'TINYINT(1)', null: 'NO', key: '', default: '0', extra: '' },
          { field: 'two_factor_enabled', type: 'TINYINT(1)', null: 'NO', key: '', default: '0', extra: '' },
          { field: 'status', type: "ENUM('ACTIVE','PENDING_OTP','SUSPENDED')", null: 'NO', key: '', default: "'PENDING_OTP'", extra: '' },
          { field: 'created_at', type: 'DATETIME', null: 'NO', key: '', default: 'CURRENT_TIMESTAMP', extra: '' },
          { field: 'last_login_at', type: 'DATETIME', null: 'YES', key: '', default: null, extra: '' },
        ]
      },
      {
        name: 'email_otps',
        description: 'Transactional one-time verification codes dispatched via email with expiration timestamp',
        rowCount: this.otps.length,
        columns: [
          { field: 'id', type: 'BIGINT AUTO_INCREMENT', null: 'NO', key: 'PRI', default: null, extra: 'auto_increment' },
          { field: 'email', type: 'VARCHAR(100)', null: 'NO', key: 'MUL', default: null, extra: '' },
          { field: 'otp_code', type: 'VARCHAR(6)', null: 'NO', key: '', default: null, extra: '' },
          { field: 'purpose', type: "ENUM('REGISTRATION','LOGIN_2FA','PASSWORD_RESET')", null: 'NO', key: '', default: "'REGISTRATION'", extra: '' },
          { field: 'expires_at', type: 'BIGINT', null: 'NO', key: '', default: null, extra: '' },
          { field: 'attempts', type: 'INT', null: 'NO', key: '', default: '0', extra: '' },
          { field: 'verified', type: 'TINYINT(1)', null: 'NO', key: '', default: '0', extra: '' },
          { field: 'created_at', type: 'DATETIME', null: 'NO', key: '', default: 'CURRENT_TIMESTAMP', extra: '' },
        ]
      },
      {
        name: 'security_audit_logs',
        description: 'Immutable security event audit log for login attempts, OTP validations, and user operations',
        rowCount: this.logs.length,
        columns: [
          { field: 'id', type: 'BIGINT AUTO_INCREMENT', null: 'NO', key: 'PRI', default: null, extra: 'auto_increment' },
          { field: 'user_id', type: 'BIGINT', null: 'YES', key: 'MUL', default: null, extra: '' },
          { field: 'email', type: 'VARCHAR(100)', null: 'NO', key: '', default: null, extra: '' },
          { field: 'action', type: 'VARCHAR(50)', null: 'NO', key: '', default: null, extra: '' },
          { field: 'ip_address', type: 'VARCHAR(45)', null: 'NO', key: '', default: null, extra: '' },
          { field: 'user_agent', type: 'VARCHAR(255)', null: 'YES', key: '', default: null, extra: '' },
          { field: 'status', type: "ENUM('SUCCESS','FAILURE','WARNING')", null: 'NO', key: '', default: null, extra: '' },
          { field: 'details', type: 'TEXT', null: 'YES', key: '', default: null, extra: '' },
          { field: 'timestamp', type: 'DATETIME', null: 'NO', key: '', default: 'CURRENT_TIMESTAMP', extra: '' },
        ]
      }
    ];
  }

  // --- Real SQL Query Execution Simulator ---
  public executeSql(sql: string): {
    success: boolean;
    columns: string[];
    rows: any[];
    message?: string;
    affectedRows?: number;
    latencyMs: number;
  } {
    const startTime = performance.now();
    const cleanSql = sql.trim().replace(/;$/, '');
    const upperSql = cleanSql.toUpperCase();

    const latencyMs = Math.round((performance.now() - startTime + (Math.random() * 5 + 3)) * 10) / 10;

    try {
      if (upperSql === 'SHOW TABLES' || upperSql === 'SHOW TABLES;') {
        return {
          success: true,
          columns: ['Tables_in_auth_db'],
          rows: [['users'], ['email_otps'], ['security_audit_logs']],
          latencyMs
        };
      }

      if (upperSql.startsWith('DESCRIBE') || upperSql.startsWith('DESC ')) {
        const parts = cleanSql.split(/\s+/);
        const tableName = parts[1]?.toLowerCase();
        const table = this.getTableDefinitions().find(t => t.name === tableName);
        if (!table) {
          return { success: false, columns: [], rows: [], message: `Table 'auth_db.${tableName}' doesn't exist`, latencyMs };
        }
        return {
          success: true,
          columns: ['Field', 'Type', 'Null', 'Key', 'Default', 'Extra'],
          rows: table.columns.map(c => [c.field, c.type, c.null, c.key, c.default ?? 'NULL', c.extra]),
          latencyMs
        };
      }

      if (upperSql.startsWith('SELECT')) {
        let tableName = '';
        if (upperSql.includes('FROM USERS')) tableName = 'users';
        else if (upperSql.includes('FROM EMAIL_OTPS')) tableName = 'email_otps';
        else if (upperSql.includes('FROM SECURITY_AUDIT_LOGS')) tableName = 'security_audit_logs';
        else {
          return { success: false, columns: [], rows: [], message: 'Syntax error or unsupported table. Try querying `users`, `email_otps`, or `security_audit_logs`.', latencyMs };
        }

        if (tableName === 'users') {
          const cols = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'status', 'created_at'];
          const rows = this.users.map(u => [u.id, u.username, u.email, u.firstName, u.lastName, u.role, u.status, u.createdAt]);
          return { success: true, columns: cols, rows, latencyMs };
        }

        if (tableName === 'email_otps') {
          const cols = ['id', 'email', 'otp_code', 'purpose', 'attempts', 'verified', 'created_at'];
          const rows = this.otps.map(o => [o.id, o.email, o.otpCode, o.purpose, o.attempts, o.verified ? 1 : 0, o.createdAt]);
          return { success: true, columns: cols, rows, latencyMs };
        }

        if (tableName === 'security_audit_logs') {
          const cols = ['id', 'email', 'action', 'status', 'ip_address', 'timestamp'];
          const rows = this.logs.map(l => [l.id, l.email, l.action, l.status, l.ipAddress, l.timestamp]);
          return { success: true, columns: cols, rows, latencyMs };
        }
      }

      return {
        success: true,
        columns: ['Status'],
        rows: [['Query executed successfully in MySQL']],
        affectedRows: 1,
        latencyMs
      };
    } catch (e: any) {
      return {
        success: false,
        columns: [],
        rows: [],
        message: e.message || 'SQL Execution Error',
        latencyMs
      };
    }
  }

  public getRawMysqlSchemaSql(): string {
    return `-- ========================================================
-- SecureAuth MySQL Database Schema (MySQL 8.0+)
-- Database: auth_db
-- ========================================================

CREATE DATABASE IF NOT EXISTS \`auth_db\`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE \`auth_db\`;

-- 1. Users Table
DROP TABLE IF EXISTS \`users\`;
CREATE TABLE \`users\` (
  \`id\` BIGINT NOT NULL AUTO_INCREMENT,
  \`username\` VARCHAR(50) NOT NULL,
  \`email\` VARCHAR(100) NOT NULL,
  \`first_name\` VARCHAR(50) NOT NULL,
  \`last_name\` VARCHAR(50) NOT NULL,
  \`phone\` VARCHAR(25) DEFAULT NULL,
  \`role\` VARCHAR(20) NOT NULL DEFAULT 'USER',
  \`department\` VARCHAR(100) DEFAULT NULL,
  \`password_hash\` VARCHAR(255) NOT NULL,
  \`salt\` VARCHAR(64) NOT NULL DEFAULT 'BCrypt',
  \`is_verified\` TINYINT(1) NOT NULL DEFAULT 0,
  \`two_factor_enabled\` TINYINT(1) NOT NULL DEFAULT 0,
  \`avatar_url\` VARCHAR(255) DEFAULT NULL,
  \`bio\` TEXT DEFAULT NULL,
  \`status\` VARCHAR(20) NOT NULL DEFAULT 'PENDING_OTP',
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`last_login_at\` DATETIME DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_users_username\` (\`username\`),
  UNIQUE KEY \`uk_users_email\` (\`email\`),
  INDEX \`idx_users_role_status\` (\`role\`, \`status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Email OTPs Table
DROP TABLE IF EXISTS \`email_otps\`;
CREATE TABLE \`email_otps\` (
  \`id\` BIGINT NOT NULL AUTO_INCREMENT,
  \`email\` VARCHAR(100) NOT NULL,
  \`otp_code\` VARCHAR(6) NOT NULL,
  \`purpose\` VARCHAR(30) NOT NULL DEFAULT 'REGISTRATION',
  \`expires_at\` DATETIME NOT NULL,
  \`attempts\` INT NOT NULL DEFAULT 0,
  \`verified\` TINYINT(1) NOT NULL DEFAULT 0,
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  INDEX \`idx_email_otps_lookup\` (\`email\`, \`purpose\`, \`verified\`),
  INDEX \`idx_email_otps_expiry\` (\`expires_at\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Security Audit Logs Table
DROP TABLE IF EXISTS \`security_audit_logs\`;
CREATE TABLE \`security_audit_logs\` (
  \`id\` BIGINT NOT NULL AUTO_INCREMENT,
  \`user_id\` BIGINT DEFAULT NULL,
  \`email\` VARCHAR(100) NOT NULL,
  \`action\` VARCHAR(50) NOT NULL,
  \`ip_address\` VARCHAR(45) NOT NULL,
  \`user_agent\` VARCHAR(255) DEFAULT NULL,
  \`status\` VARCHAR(20) NOT NULL,
  \`details\` TEXT,
  \`timestamp\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  INDEX \`idx_audit_email_time\` (\`email\`, \`timestamp\`),
  CONSTRAINT \`fk_audit_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`;
  }
}

export const dbService = new MysqlDatabaseService();

