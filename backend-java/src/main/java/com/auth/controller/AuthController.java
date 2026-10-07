package com.auth.controller;

import com.auth.model.User;
import com.auth.service.UserService;
import com.auth.service.EmailOtpService;
import com.auth.service.CaptchaService;
import org.springframework.beans.factory.annotation.Autowired;
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

        if (!captchaService.verify(captchaToken, captchaInput)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid CAPTCHA security code"));
        }

        User user = userService.registerUser(payload);
        emailOtpService.sendOtp(user.getEmail(), "REGISTRATION");

        return ResponseEntity.ok(Map.of(
            "message", "User saved to MySQL. Verification OTP sent to email.",
            "email", user.getEmail()
        ));
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

        boolean valid = emailOtpService.verifyOtp(email, otpCode, purpose);
        if (!valid) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid or expired OTP code"));
        }

        userService.activateUser(email);
        return ResponseEntity.ok(Map.of("message", "Account verified and activated successfully in MySQL"));
    }

    /**
     * 4. POST /api/auth/login
     * Authenticates credentials with BCrypt and checks CAPTCHA + 2FA.
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> payload) {
        return ResponseEntity.ok(userService.authenticate(payload));
    }
}
