-- Sample Initial Seed Data for SecureAuth MySQL
USE `auth_db`;

-- Pre-seed Admin and Test accounts
INSERT INTO `users` (
  `id`, `username`, `email`, `first_name`, `last_name`, `phone`, 
  `role`, `department`, `password_hash`, `salt`, `is_verified`, 
  `two_factor_enabled`, `status`, `created_at`
) VALUES 
(
  1, 'admin', 'admin@enterprise.io', 'Marcus', 'Vance', '+1 (555) 349-8821', 
  'ADMIN', 'Cybersecurity Operations', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', 
  'salt_master_adm_99', 1, 0, 'ACTIVE', NOW()
),
(
  2, 'dev_sarah', 'sarah.connor@enterprise.io', 'Sarah', 'Connor', '+1 (555) 892-1204', 
  'DEVELOPER', 'Cloud Infrastructure', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', 
  'salt_dev_sarah_42', 1, 1, 'ACTIVE', NOW()
);

-- Pre-seed initial security audit log
INSERT INTO `security_audit_logs` (`user_id`, `email`, `action`, `ip_address`, `status`, `details`, `timestamp`)
VALUES (1, 'admin@enterprise.io', 'SYSTEM_INITIALIZATION', '127.0.0.1', 'SUCCESS', 'MySQL database initialized with default admin credentials.', NOW());
