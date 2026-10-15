package com.auth.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_users_email", columnList = "email"),
    @Index(name = "idx_users_username", columnList = "username")
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

    @Column(length = 25)
    private String phone;

    @Builder.Default
    @Column(nullable = false, length = 20)
    private String role = "USER"; // ADMIN, DEVELOPER, MANAGER, USER

    @Column(length = 100)
    private String department;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Builder.Default
    @Column(length = 64, nullable = false)
    private String salt = "BCrypt";

    @Builder.Default
    @Column(name = "is_verified", nullable = false)
    private boolean isVerified = false;

    @Builder.Default
    @Column(name = "two_factor_enabled", nullable = false)
    private boolean twoFactorEnabled = false;

    @Column(name = "avatar_url", length = 255)
    private String avatarUrl;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Builder.Default
    @Column(nullable = false, length = 20)
    private String status = "PENDING_OTP"; // ACTIVE, PENDING_OTP, SUSPENDED

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.status == null) {
            this.status = "PENDING_OTP";
        }
        if (this.role == null) {
            this.role = "USER";
        }
        if (this.salt == null) {
            this.salt = "BCrypt";
        }
    }

    // Explicit boolean aliases to guarantee IDE & Jackson compatibility
    public boolean isVerified() {
        return this.isVerified;
    }

    public void setVerified(boolean verified) {
        this.isVerified = verified;
    }

    public void setIsVerified(boolean isVerified) {
        this.isVerified = isVerified;
    }
}
