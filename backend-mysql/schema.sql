-- ========================================================
-- SecureAuth MySQL Database Schema (MySQL 8.0+)
-- Database: auth_db
-- ========================================================

CREATE DATABASE IF NOT EXISTS `auth_db`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `auth_db`;

-- 1. Users Table
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `first_name` VARCHAR(50) NOT NULL,
  `last_name` VARCHAR(50) NOT NULL,
  `phone` VARCHAR(25) DEFAULT NULL,
  `role` ENUM('ADMIN', 'DEVELOPER', 'MANAGER', 'USER') NOT NULL DEFAULT 'USER',
  `department` VARCHAR(100) DEFAULT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `salt` VARCHAR(64) NOT NULL,
  `is_verified` TINYINT(1) NOT NULL DEFAULT 0,
  `two_factor_enabled` TINYINT(1) NOT NULL DEFAULT 0,
  `avatar_url` VARCHAR(255) DEFAULT NULL,
  `bio` TEXT DEFAULT NULL,
  `status` ENUM('ACTIVE', 'PENDING_OTP', 'SUSPENDED') NOT NULL DEFAULT 'PENDING_OTP',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_login_at` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_users_username` (`username`),
  UNIQUE KEY `uk_users_email` (`email`),
  INDEX `idx_users_role_status` (`role`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Email OTPs Table
DROP TABLE IF EXISTS `email_otps`;
CREATE TABLE `email_otps` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(100) NOT NULL,
  `otp_code` VARCHAR(6) NOT NULL,
  `purpose` ENUM('REGISTRATION', 'LOGIN_2FA', 'PASSWORD_RESET') NOT NULL DEFAULT 'REGISTRATION',
  `expires_at` BIGINT NOT NULL,
  `attempts` INT NOT NULL DEFAULT 0,
  `verified` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_email_otps_lookup` (`email`, `purpose`, `verified`),
  INDEX `idx_email_otps_expiry` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Security Audit Logs Table
DROP TABLE IF EXISTS `security_audit_logs`;
CREATE TABLE `security_audit_logs` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT DEFAULT NULL,
  `email` VARCHAR(100) NOT NULL,
  `action` VARCHAR(50) NOT NULL,
  `ip_address` VARCHAR(45) NOT NULL,
  `user_agent` VARCHAR(255) DEFAULT NULL,
  `status` ENUM('SUCCESS', 'FAILURE', 'WARNING') NOT NULL,
  `details` TEXT,
  `timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_audit_email_time` (`email`, `timestamp`),
  CONSTRAINT `fk_audit_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
