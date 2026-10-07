package com.auth.service;

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

    // =========================================================
    // REGISTER USER
    // =========================================================

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

        // ---------- Basic validation ----------
        if (username == null || username.isBlank()) {
            throw new IllegalArgumentException("Username is required");
        }
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }
        if (password == null || password.isBlank()) {
            throw new IllegalArgumentException("Password is required");
        }

        // ---------- Check duplicate email ----------
        if (userRepository.existsByEmail(email.trim())) {
            throw new IllegalArgumentException("Email is already registered");
        }

        // ---------- Check duplicate username ----------
        if (userRepository.existsByUsername(username.trim())) {
            throw new IllegalArgumentException("Username is already taken");
        }

        // ---------- Create User ----------
        User user = new User();
        user.setUsername(username.trim());
        user.setEmail(email.trim().toLowerCase());
        user.setFirstName(firstName != null ? firstName.trim() : "");
        user.setLastName(lastName != null ? lastName.trim() : "");
        user.setPhone(phone != null ? phone.trim() : "");
        user.setRole(role == null || role.isBlank() ? "USER" : role.toUpperCase());
        user.setDepartment(department != null ? department.trim() : "");

        // ---------- BCrypt password hashing ----------
        String hashedPassword = passwordEncoder.encode(password);
        user.setPasswordHash(hashedPassword);
        user.setSalt("BCrypt");

        // ---------- Initial account status ----------
        user.setVerified(false);
        user.setTwoFactorEnabled(false);
        user.setStatus("PENDING_OTP");
        user.setCreatedAt(LocalDateTime.now());

        // ---------- Save to MySQL ----------
        return userRepository.save(user);
    }

    // =========================================================
    // ACTIVATE USER AFTER OTP VERIFICATION
    // =========================================================

    @Transactional
    public void activateUser(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email cannot be empty");
        }

        User user = userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("User not found for email: " + email));

        user.setVerified(true);
        user.setStatus("ACTIVE");
        userRepository.save(user);
    }

    // =========================================================
    // LOGIN / AUTHENTICATION
    // =========================================================

    @Transactional
    public Map<String, Object> authenticate(Map<String, String> payload) {
        String identifier = payload.containsKey("email") ? payload.get("email") : payload.get("username");
        String password = payload.get("password");

        // ---------- Validate input ----------
        if (identifier == null || identifier.isBlank()) {
            throw new IllegalArgumentException("Email or Username is required");
        }
        if (password == null || password.isBlank()) {
            throw new IllegalArgumentException("Password is required");
        }

        String searchKey = identifier.trim();

        // ---------- Find user (by email or username) ----------
        Optional<User> userOpt = userRepository.findByEmail(searchKey.toLowerCase());
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByUsername(searchKey);
        }

        User user = userOpt.orElseThrow(() ->
                new IllegalArgumentException("Invalid email/username or password"));

        // ---------- Check password ----------
        boolean passwordMatches = passwordEncoder.matches(password, user.getPasswordHash());
        if (!passwordMatches) {
            throw new IllegalArgumentException("Invalid email/username or password");
        }

        // ---------- Check OTP verification ----------
        if (!user.isVerified()) {
            throw new IllegalArgumentException("Please verify your email with the OTP sent to your inbox");
        }

        // ---------- Check account status ----------
        if (!"ACTIVE".equalsIgnoreCase(user.getStatus())) {
            throw new IllegalArgumentException("Account is " + user.getStatus() + ". Please contact administrator.");
        }

        // ---------- Update last login ----------
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        // ---------- Build Response ----------
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Login successful");
        response.put("id", user.getId());
        response.put("email", user.getEmail());
        response.put("username", user.getUsername());
        response.put("firstName", user.getFirstName());
        response.put("lastName", user.getLastName());
        response.put("phone", user.getPhone());
        response.put("role", user.getRole());
        response.put("department", user.getDepartment());
        response.put("verified", user.isVerified());
        response.put("twoFactorEnabled", user.isTwoFactorEnabled());
        response.put("status", user.getStatus());

        return response;
    }

    // =========================================================
    // GET USER BY EMAIL
    // =========================================================

    public Optional<User> findByEmail(String email) {
        if (email == null || email.isBlank()) return Optional.empty();
        return userRepository.findByEmail(email.trim().toLowerCase());
    }
}