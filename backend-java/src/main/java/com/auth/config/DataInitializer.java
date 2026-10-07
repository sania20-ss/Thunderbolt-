package com.auth.config;

import com.auth.model.User;
import com.auth.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;

@Configuration
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        try {
            // Pre-seed demo Administrator account in MySQL if not present
            if (!userRepository.existsByEmail("admin@enterprise.io")) {
                User admin = User.builder()
                        .username("admin")
                        .email("admin@enterprise.io")
                        .firstName("Marcus")
                        .lastName("Vance")
                        .phone("+1 (555) 349-8821")
                        .role("ADMIN")
                        .department("Cybersecurity Operations")
                        .passwordHash(passwordEncoder.encode("Admin@2026!"))
                        .salt("BCrypt")
                        .isVerified(true)
                        .twoFactorEnabled(false)
                        .status("ACTIVE")
                        .createdAt(LocalDateTime.now())
                        .build();

                userRepository.save(admin);
                log.info("Initialized default admin user [admin@enterprise.io] in MySQL database (auth_db.users)");
            }

            // Pre-seed demo Developer account in MySQL if not present
            if (!userRepository.existsByEmail("sarah.connor@enterprise.io")) {
                User dev = User.builder()
                        .username("dev_sarah")
                        .email("sarah.connor@enterprise.io")
                        .firstName("Sarah")
                        .lastName("Connor")
                        .phone("+1 (555) 892-1204")
                        .role("DEVELOPER")
                        .department("Cloud Infrastructure")
                        .passwordHash(passwordEncoder.encode("Admin@2026!"))
                        .salt("BCrypt")
                        .isVerified(true)
                        .twoFactorEnabled(true)
                        .status("ACTIVE")
                        .createdAt(LocalDateTime.now())
                        .build();

                userRepository.save(dev);
                log.info("Initialized default developer user [sarah.connor@enterprise.io] in MySQL database");
            }
        } catch (Exception e) {
            log.warn("Database initialization notice: {}", e.getMessage());
        }
    }
}
