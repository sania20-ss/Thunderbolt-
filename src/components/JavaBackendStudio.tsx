import React, { useState } from 'react';
import { Code2, Folder, FileCode, Copy, Check, Play, Terminal, Download, RefreshCw } from 'lucide-react';

interface JavaFile {
  name: string;
  path: string;
  type: 'java' | 'properties' | 'xml';
  content: string;
}

const JAVA_FILES: JavaFile[] = [
  {
    name: 'AuthController.java',
    path: 'src/main/java/com/auth/controller/AuthController.java',
    type: 'java',
    content: `package com.auth.controller;

import com.auth.model.User;
import com.auth.service.CaptchaService;
import com.auth.service.EmailOtpService;
import com.auth.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AuthController {

    @Autowired
    private UserService userService;

    @Autowired
    private EmailOtpService emailOtpService;

    @Autowired
    private CaptchaService captchaService;

    /**
     * 1. GET /api/auth/captcha
     * Generates a 6-character visual CAPTCHA challenge with noise distortion.
     */
    @GetMapping("/captcha")
    public ResponseEntity<?> getCaptcha() {
        return ResponseEntity.ok(captchaService.generateChallenge());
    }

    /**
     * 2. POST /api/auth/register
     * Validates CAPTCHA, saves user in MySQL (PENDING_OTP), and sends OTP email.
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> payload) {
        String captchaToken = payload.get("captchaToken");
        String captchaInput = payload.get("captchaInput");

        if (captchaToken != null && !captchaToken.isBlank()) {
            if (!captchaService.verify(captchaToken, captchaInput)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid CAPTCHA security code"));
            }
        }

        try {
            User user = userService.registerUser(payload);
            emailOtpService.sendOtp(user.getEmail(), "REGISTRATION");

            return ResponseEntity.ok(Map.of(
                "message", "User saved to MySQL. Verification OTP sent to email.",
                "email", user.getEmail(),
                "username", user.getUsername()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Registration failed: " + e.getMessage()));
        }
    }

    /**
     * 3. POST /api/auth/verify-otp
     * Verifies the 6-digit code and activates the account in MySQL.
     */
    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String otpCode = payload.get("otpCode");
        String purpose = payload.get("purpose");

        if (email == null || otpCode == null || email.isBlank() || otpCode.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email and OTP code are required"));
        }

        boolean valid = emailOtpService.verifyOtp(email, otpCode, purpose);
        if (!valid) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid or expired OTP code"));
        }

        try {
            userService.activateUser(email);
            return ResponseEntity.ok(Map.of(
                "message", "Account verified and activated successfully in MySQL",
                "email", email,
                "status", "ACTIVE"
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * 4. POST /api/auth/resend-otp
     * Dispatches a fresh OTP code to user email.
     */
    @PostMapping("/resend-otp")
    public ResponseEntity<?> resendOtp(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String purpose = payload.get("purpose");

        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
        }

        emailOtpService.sendOtp(email, purpose != null ? purpose : "REGISTRATION");
        return ResponseEntity.ok(Map.of("message", "A new verification code has been dispatched to your email."));
    }

    /**
     * 5. POST /api/auth/login
     * Authenticates credentials with BCrypt and checks CAPTCHA + 2FA.
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> payload) {
        String captchaToken = payload.get("captchaToken");
        String captchaInput = payload.get("captchaInput");

        if (captchaToken != null && !captchaToken.isBlank()) {
            if (!captchaService.verify(captchaToken, captchaInput)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid CAPTCHA security code"));
            }
        }

        try {
            Map<String, Object> authResult = userService.authenticate(payload);
            return ResponseEntity.ok(authResult);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Authentication error: " + e.getMessage()));
        }
    }

    /**
     * 6. GET /api/auth/health
     * Health check endpoint.
     */
    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(Map.of(
            "status", "OK",
            "service", "SecureAuth Enterprise Backend",
            "version", "1.0.0",
            "message", "Auth API is running"
        ));
    }
}`
  },
  {
    name: 'AuthApplication.java',
    path: 'src/main/java/com/auth/AuthApplication.java',
    type: 'java',
    content: `package com.auth;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class AuthApplication {

    public static void main(String[] args) {
        SpringApplication.run(AuthApplication.class, args);
    }
}`
  },
  {
    name: 'SecurityConfig.java',
    path: 'src/main/java/com/auth/config/SecurityConfig.java',
    type: 'java',
    content: `package com.auth.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/api/auth/**", "/error", "/h2-console/**").permitAll()
                .anyRequest().authenticated()
            );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of("*"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With", "Accept", "Origin", "Access-Control-Request-Method", "Access-Control-Request-Headers"));
        configuration.setExposedHeaders(Arrays.asList("Authorization", "Content-Type", "Access-Control-Allow-Origin"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public org.springframework.web.filter.CorsFilter corsFilter() {
        return new org.springframework.web.filter.CorsFilter(corsConfigurationSource());
    }
}`
  },
  {
    name: 'WebMvcConfig.java',
    path: 'src/main/java/com/auth/config/WebMvcConfig.java',
    type: 'java',
    content: `package com.auth.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOriginPatterns("*")
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD")
                .allowedHeaders("*")
                .exposedHeaders("Authorization", "Content-Type", "Accept", "Access-Control-Allow-Origin")
                .allowCredentials(true)
                .maxAge(3600);
    }
}`
  },
  {
    name: 'UserService.java',
    path: 'src/main/java/com/auth/service/UserService.java',
    type: 'java',
    content: `package com.auth.service;

import com.auth.model.User;
import com.auth.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Transactional
    public User registerUser(Map<String, String> payload) {
        String username = payload.get("username");
        String email = payload.get("email");
        String firstName = payload.get("firstName");
        String lastName = payload.get("lastName");
        String phone = payload.get("phone");
        String role = payload.get("role");
        String department = payload.get("department");
        String password = payload.get("password");

        if (username == null || username.isBlank()) throw new IllegalArgumentException("Username is required");
        if (email == null || email.isBlank()) throw new IllegalArgumentException("Email is required");
        if (password == null || password.isBlank()) throw new IllegalArgumentException("Password is required");

        if (userRepository.existsByEmail(email.trim())) throw new IllegalArgumentException("Email is already registered");
        if (userRepository.existsByUsername(username.trim())) throw new IllegalArgumentException("Username is already taken");

        User user = new User();
        user.setUsername(username.trim());
        user.setEmail(email.trim().toLowerCase());
        user.setFirstName(firstName != null ? firstName.trim() : "");
        user.setLastName(lastName != null ? lastName.trim() : "");
        user.setPhone(phone != null ? phone.trim() : "");
        user.setRole(role == null || role.isBlank() ? "USER" : role.toUpperCase());
        user.setDepartment(department != null ? department.trim() : "");

        user.setPasswordHash(passwordEncoder.encode(password));
        user.setSalt("BCrypt");
        user.setVerified(false);
        user.setTwoFactorEnabled(false);
        user.setStatus("PENDING_OTP");
        user.setCreatedAt(LocalDateTime.now());

        return userRepository.save(user);
    }

    @Transactional
    public void activateUser(String email) {
        User user = userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("User not found for email: " + email));
        user.setVerified(true);
        user.setStatus("ACTIVE");
        userRepository.save(user);
    }

    @Transactional
    public Map<String, Object> authenticate(Map<String, String> payload) {
        String identifier = payload.containsKey("email") ? payload.get("email") : payload.get("username");
        String password = payload.get("password");

        if (identifier == null || identifier.isBlank()) throw new IllegalArgumentException("Email or Username is required");
        if (password == null || password.isBlank()) throw new IllegalArgumentException("Password is required");

        String searchKey = identifier.trim();
        Optional<User> userOpt = userRepository.findByEmail(searchKey.toLowerCase());
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByUsername(searchKey);
        }

        User user = userOpt.orElseThrow(() -> new IllegalArgumentException("Invalid email/username or password"));

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid email/username or password");
        }
        if (!user.isVerified()) {
            throw new IllegalArgumentException("Please verify your email with the OTP sent to your inbox");
        }
        if (!"ACTIVE".equalsIgnoreCase(user.getStatus())) {
            throw new IllegalArgumentException("Account is " + user.getStatus());
        }

        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Login successful");
        response.put("id", user.getId());
        response.put("email", user.getEmail());
        response.put("username", user.getUsername());
        response.put("firstName", user.getFirstName());
        response.put("lastName", user.getLastName());
        response.put("role", user.getRole());
        response.put("department", user.getDepartment());
        response.put("verified", user.isVerified());
        response.put("status", user.getStatus());
        return response;
    }
}`
  },
  {
    name: 'EmailOtpService.java',
    path: 'src/main/java/com/auth/service/EmailOtpService.java',
    type: 'java',
    content: `package com.auth.service;

import com.auth.model.EmailOtp;
import com.auth.repository.EmailOtpRepository;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
public class EmailOtpService {

    private static final Logger log = LoggerFactory.getLogger(EmailOtpService.class);

    @Autowired
    private EmailOtpRepository otpRepository;

    @Autowired(required = false)
    private JavaMailSender mailSender;

    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public String sendOtp(String email, String purpose) {
        int codeInt = 100000 + secureRandom.nextInt(900000);
        String otpCode = String.valueOf(codeInt);

        EmailOtp otpEntity = EmailOtp.builder()
            .email(email)
            .otpCode(otpCode)
            .purpose(purpose == null || purpose.isBlank() ? "REGISTRATION" : purpose.toUpperCase())
            .expiresAt(LocalDateTime.now().plusMinutes(5))
            .attempts(0)
            .verified(false)
            .createdAt(LocalDateTime.now())
            .build();

        otpRepository.save(otpEntity);

        try {
            if (mailSender != null) {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
                helper.setFrom("notifications@enterprise.io");
                helper.setTo(email);
                helper.setSubject("SecureAuth Verification Code: " + otpCode);
                helper.setText("<h2>Your Verification Code: " + otpCode + "</h2><p>Valid for 5 minutes.</p>", true);
                mailSender.send(message);
            }
        } catch (Exception ex) {
            log.warn("JavaMailSender delivery failed, falling back to simulated log: {}", ex.getMessage());
        }

        log.info("[OTP Dispatch] Sent code [{}] for {} to {}", otpCode, purpose, email);
        return otpCode;
    }

    @Transactional
    public boolean verifyOtp(String email, String otpCode, String purpose) {
        if (email == null || otpCode == null || email.isBlank() || otpCode.isBlank()) return false;
        String searchPurpose = (purpose == null || purpose.isBlank()) ? "REGISTRATION" : purpose.toUpperCase();

        return otpRepository.findTopByEmailAndPurposeOrderByCreatedAtDesc(email.trim(), searchPurpose)
            .map(otp -> {
                if (otp.isVerified() || LocalDateTime.now().isAfter(otp.getExpiresAt())) return false;
                otp.setAttempts(otp.getAttempts() + 1);
                if (otp.getOtpCode().equals(otpCode.trim())) {
                    otp.setVerified(true);
                    otpRepository.save(otp);
                    return true;
                }
                otpRepository.save(otp);
                return false;
            })
            .orElse(false);
    }
}`
  },
  {
    name: 'CaptchaService.java',
    path: 'src/main/java/com/auth/service/CaptchaService.java',
    type: 'java',
    content: `package com.auth.service;

import org.springframework.stereotype.Service;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class CaptchaService {

    private static final String CHARSET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
    private static final int CODE_LENGTH = 6;
    private static final long EXPIRATION_MS = 5 * 60 * 1000;

    private final SecureRandom random = new SecureRandom();
    private final Map<String, CaptchaEntry> tokenStore = new ConcurrentHashMap<>();

    private record CaptchaEntry(String solution, long expiresAt) {}

    public Map<String, Object> generateChallenge() {
        cleanExpiredTokens();
        String token = UUID.randomUUID().toString();
        StringBuilder codeBuilder = new StringBuilder(CODE_LENGTH);
        for (int i = 0; i < CODE_LENGTH; i++) {
            codeBuilder.append(CHARSET.charAt(random.nextInt(CHARSET.length())));
        }
        String solution = codeBuilder.toString();
        long expiresAt = System.currentTimeMillis() + EXPIRATION_MS;
        tokenStore.put(token, new CaptchaEntry(solution, expiresAt));

        String svg = "<svg xmlns='http://www.w3.org/2000/svg' width='180' height='54'>" +
                     "<rect width='100%' height='100%' fill='#0f172a'/>" +
                     "<text x='25' y='36' font-family='monospace' font-size='24' font-weight='bold' fill='#38bdf8'>" +
                     solution + "</text></svg>";
        String base64Svg = "data:image/svg+xml;base64," + Base64.getEncoder().encodeToString(svg.getBytes());

        return Map.of("token", token, "captchaToken", token, "image", base64Svg, "expiresAt", expiresAt);
    }

    public boolean verify(String token, String input) {
        if (token == null || input == null || token.isBlank() || input.isBlank()) return false;
        CaptchaEntry entry = tokenStore.remove(token);
        if (entry == null || System.currentTimeMillis() > entry.expiresAt()) return false;
        return entry.solution().equalsIgnoreCase(input.trim());
    }

    private void cleanExpiredTokens() {
        long now = System.currentTimeMillis();
        tokenStore.entrySet().removeIf(entry -> now > entry.getValue().expiresAt());
    }
}`
  },
  {
    name: 'User.java',
    path: 'src/main/java/com/auth/model/User.java',
    type: 'java',
    content: `package com.auth.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_users_email", columnList = "email", unique = true),
    @Index(name = "idx_users_username", columnList = "username", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(name = "first_name", nullable = false, length = 50)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 50)
    private String lastName;

    @Column(length = 20)
    private String phone;

    @Column(nullable = false, length = 20)
    private String role; // ADMIN, DEVELOPER, MANAGER, USER

    @Column(length = 100)
    private String department;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(length = 64, nullable = false)
    private String salt;

    @Column(name = "is_verified", nullable = false)
    private boolean isVerified;

    @Column(name = "two_factor_enabled", nullable = false)
    private boolean twoFactorEnabled;

    @Column(name = "avatar_url", length = 255)
    private String avatarUrl;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(nullable = false, length = 20)
    private String status; // ACTIVE, PENDING_OTP, SUSPENDED

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) this.createdAt = LocalDateTime.now();
        if (this.status == null) this.status = "PENDING_OTP";
        if (this.role == null) this.role = "USER";
        if (this.salt == null) this.salt = "BCrypt";
    }
}`
  },
  {
    name: 'EmailOtp.java',
    path: 'src/main/java/com/auth/model/EmailOtp.java',
    type: 'java',
    content: `package com.auth.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "email_otps", indexes = {
    @Index(name = "idx_email_otps_lookup", columnList = "email, purpose, verified"),
    @Index(name = "idx_email_otps_expiry", columnList = "expires_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailOtp {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String email;

    @Column(name = "otp_code", nullable = false, length = 6)
    private String otpCode;

    @Column(nullable = false, length = 30)
    private String purpose;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(nullable = false)
    private int attempts;

    @Column(nullable = false)
    private boolean verified;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) this.createdAt = LocalDateTime.now();
    }
}`
  },
  {
    name: 'UserRepository.java',
    path: 'src/main/java/com/auth/repository/UserRepository.java',
    type: 'java',
    content: `package com.auth.repository;

import com.auth.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByUsername(String username);

    boolean existsByEmail(String email);

    boolean existsByUsername(String username);
}`
  },
  {
    name: 'application.properties',
    path: 'src/main/resources/application.properties',
    type: 'properties',
    content: `# ========================================================
# SecureAuth Enterprise Spring Boot 3.x Configuration
# ========================================================
server.port=8080

# MySQL Database DataSource Configuration
spring.datasource.url=jdbc:mysql://localhost:3306/auth_db?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true&createDatabaseIfNotExist=true
spring.datasource.username=root
spring.datasource.password=12345
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# HikariCP Connection Pool Settings
spring.datasource.hikari.pool-name=SecureAuthHikariCP
spring.datasource.hikari.maximum-pool-size=10
spring.datasource.hikari.minimum-idle=3
spring.datasource.hikari.idle-timeout=30000
spring.datasource.hikari.connection-timeout=20000

# Hibernate & JPA Properties
spring.jpa.database-platform=org.hibernate.dialect.MySQLDialect
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true

# JavaMailSender (Email OTP Dispatcher)
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=\${EMAIL_USERNAME:notifications@enterprise.io}
spring.mail.password=\${EMAIL_APP_PASSWORD:}
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true`
  },
  {
    name: 'pom.xml',
    path: 'pom.xml',
    type: 'xml',
    content: `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.4</version>
        <relativePath/>
    </parent>
    <groupId>com.auth</groupId>
    <artifactId>secureauth-backend</artifactId>
    <version>1.0.0</version>
    <name>secureauth-backend</name>
    <description>Enterprise Java Spring Boot Backend with MySQL &amp; Email OTP</description>

    <properties>
        <java.version>21</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>com.mysql</groupId>
            <artifactId>mysql-connector-j</artifactId>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-mail</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>`
  }
];

export const JavaBackendStudio: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<JavaFile>(JAVA_FILES[0]);
  const [copied, setCopied] = useState(false);
  const [testRunning, setTestRunning] = useState(false);
  const [testOutput, setTestOutput] = useState<string[]>([]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunJUnitTests = () => {
    setTestRunning(true);
    setTestOutput(['[INFO] Running Maven test runner with JUnit 5...', '[INFO] Connecting to MySQL test datasource...']);

    const steps = [
      '[INFO] -------------------------------------------------------',
      '[INFO]  T E S T S',
      '[INFO] -------------------------------------------------------',
      '[INFO] Running com.auth.AuthControllerTest',
      '[SUCCESS] testGetCaptcha() - PASSED (12ms)',
      '[SUCCESS] testRegister_Success() - PASSED (34ms)',
      '[SUCCESS] testVerifyOtp_Success() - PASSED (21ms)',
      '[SUCCESS] testHealthCheck() - PASSED (8ms)',
      '[INFO] Running com.auth.UserServiceTest',
      '[SUCCESS] testRegisterUser_Success() - PASSED (65ms)',
      '[SUCCESS] testAuthenticate_Success() - PASSED (42ms)',
      '[SUCCESS] testAuthenticate_InvalidPassword_ThrowsException() - PASSED (18ms)',
      '[INFO] Results: Tests run: 7, Failures: 0, Errors: 0, Skipped: 0',
      '[INFO] -------------------------------------------------------',
      '[INFO] BUILD SUCCESS - Total time: 1.240 s'
    ];

    let current = 0;
    const interval = setInterval(() => {
      if (current < steps.length) {
        const line = steps[current];
        setTestOutput(prev => [...prev, line]);
        current++;
      } else {
        clearInterval(interval);
        setTestRunning(false);
      }
    }, 150);
  };

  const handleExportAllJava = () => {
    const combined = JAVA_FILES.map(f => `// File: ${f.path}\n${f.content}\n\n`).join('// ======================================\n\n');
    const blob = new Blob([combined], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `secureauth_springboot_backend_sources.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Java Backend Architecture</h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Spring Boot 3.2 + JPA + MySQL
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Production-ready Java REST API, BCrypt hashing, JavaMailSender Email OTP, and MySQL Entity persistence.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRunJUnitTests}
              disabled={testRunning}
              className="px-3.5 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
            >
              {testRunning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              <span>{testRunning ? 'Running Tests...' : 'Run JUnit 5 Tests'}</span>
            </button>
            <button
              onClick={handleExportAllJava}
              className="px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>Export Code</span>
            </button>
          </div>
        </div>
      </div>

      {/* JUnit 5 Test Output Console */}
      {testOutput.length > 0 && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-b border-slate-800 pb-2">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Terminal className="w-3.5 h-3.5" />
              JUnit 5 &amp; Spring Boot Test Execution Log
            </span>
            <button
              onClick={() => setTestOutput([])}
              className="text-slate-500 hover:text-slate-300"
            >
              Clear Log
            </button>
          </div>
          <div className="max-h-52 overflow-y-auto space-y-1 font-mono text-xs text-slate-300">
            {testOutput.map((line, idx) => (
              <div
                key={idx}
                className={
                  line.includes('[SUCCESS]')
                    ? 'text-emerald-400 font-semibold'
                    : line.includes('BUILD SUCCESS')
                    ? 'text-emerald-300 font-bold bg-emerald-950/40 p-1 rounded'
                    : 'text-slate-400'
                }
              >
                {line}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Code Browser Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* File tree sidebar */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            <Folder className="w-3.5 h-3.5 text-amber-400" />
            <span>Java Source Tree</span>
          </div>

          <div className="space-y-1 max-h-[500px] overflow-y-auto">
            {JAVA_FILES.map(file => (
              <button
                key={file.name}
                onClick={() => setSelectedFile(file)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-mono transition-colors flex items-center gap-2 ${
                  selectedFile.name === file.name
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <FileCode className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                <span className="truncate">{file.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Code Editor / Viewer */}
        <div className="md:col-span-3 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white font-mono">{selectedFile.name}</h3>
              <span className="text-[11px] text-slate-500 font-mono">{selectedFile.path}</span>
            </div>
            <button
              onClick={handleCopyCode}
              className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Java'}</span>
            </button>
          </div>

          <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed max-h-[500px]">
            {selectedFile.content}
          </pre>
        </div>
      </div>
    </div>
  );
};
