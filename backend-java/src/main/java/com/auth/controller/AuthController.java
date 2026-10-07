package com.auth.controller;

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
@CrossOrigin(originPatterns = "*", allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.PATCH, RequestMethod.DELETE, RequestMethod.OPTIONS}, allowCredentials = "true", maxAge = 3600)
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

        // Validate CAPTCHA if provided
        if (captchaToken != null && !captchaToken.isBlank()) {
            if (!captchaService.verify(captchaToken, captchaInput)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid CAPTCHA security code"));
            }
        }

        try {
            User user = userService.registerUser(payload);
            String otpCode = emailOtpService.sendOtp(user.getEmail(), "REGISTRATION");

            return ResponseEntity.ok(Map.of(
                "message", "User saved to MySQL. Verification OTP sent to email.",
                "email", user.getEmail(),
                "username", user.getUsername(),
                "otpCode", otpCode
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
     * Dispatches a fresh OTP code to the user's email.
     */
    @PostMapping("/resend-otp")
    public ResponseEntity<?> resendOtp(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String purpose = payload.get("purpose");

        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
        }

        String otpCode = emailOtpService.sendOtp(email, purpose != null ? purpose : "REGISTRATION");
        return ResponseEntity.ok(Map.of(
            "message", "A new verification code has been dispatched to your email.",
            "otpCode", otpCode,
            "email", email
        ));
    }

    /**
     * 5. POST /api/auth/login
     * Authenticates credentials with BCrypt and checks CAPTCHA + 2FA.
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> payload) {
        String captchaToken = payload.get("captchaToken");
        String captchaInput = payload.get("captchaInput");

        // Validate CAPTCHA if provided
        if (captchaToken != null && !captchaToken.isBlank()) {
            if (!captchaService.verify(captchaToken, captchaInput)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid CAPTCHA security code"));
            }
        }

        try {
            Map<String, Object> authResult = userService.authenticate(payload);

            // Handle Two-Factor Authentication if enabled
            Boolean twoFactor = (Boolean) authResult.get("twoFactorEnabled");
            if (Boolean.TRUE.equals(twoFactor)) {
                String email = (String) authResult.get("email");
                String otpCode = emailOtpService.sendOtp(email, "LOGIN_2FA");
                return ResponseEntity.ok(Map.of(
                    "requires2FA", true,
                    "requiresOtp", true,
                    "email", email,
                    "otpCode", otpCode,
                    "message", "Two-factor authentication code sent to email."
                ));
            }

            return ResponseEntity.ok(authResult);
        } catch (IllegalArgumentException e) {
            String msg = e.getMessage();
            if (msg != null && msg.toLowerCase().contains("verify your email")) {
                String identifier = payload.containsKey("email") ? payload.get("email") : payload.get("username");
                if (identifier != null && !identifier.isBlank()) {
                    userService.findByEmail(identifier).ifPresent(u -> {
                        emailOtpService.sendOtp(u.getEmail(), "REGISTRATION");
                    });
                }
                return ResponseEntity.badRequest().body(Map.of(
                    "error", msg,
                    "requiresOtp", true,
                    "email", identifier != null ? identifier : ""
                ));
            }
            return ResponseEntity.badRequest().body(Map.of("error", msg));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Authentication error: " + e.getMessage()));
        }
    }

    /**
     * 6. GET /api/auth/health
     * Health check endpoint for verifying backend uptime.
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
}