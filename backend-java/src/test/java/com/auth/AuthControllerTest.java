package com.auth;

import com.auth.controller.AuthController;
import com.auth.model.User;
import com.auth.service.CaptchaService;
import com.auth.service.EmailOtpService;
import com.auth.service.UserService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AuthControllerTest {

    @Mock
    private UserService userService;

    @Mock
    private EmailOtpService emailOtpService;

    @Mock
    private CaptchaService captchaService;

    @InjectMocks
    private AuthController authController;

    @Test
    void testGetCaptcha() {
        when(captchaService.generateChallenge()).thenReturn(Map.of("token", "xyz", "image", "data:..."));
        ResponseEntity<?> response = authController.getCaptcha();
        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
    }

    @Test
    void testRegister_Success() {
        when(captchaService.verify("validToken", "1234")).thenReturn(true);
        User mockUser = User.builder().email("test@example.com").username("testuser").build();
        when(userService.registerUser(any())).thenReturn(mockUser);
        when(emailOtpService.sendOtp("test@example.com", "REGISTRATION")).thenReturn("654321");

        Map<String, String> payload = Map.of(
                "captchaToken", "validToken",
                "captchaInput", "1234",
                "username", "testuser",
                "email", "test@example.com",
                "password", "Pass1234!"
        );

        ResponseEntity<?> response = authController.register(payload);
        assertEquals(200, response.getStatusCode().value());
    }

    @Test
    void testVerifyOtp_Success() {
        when(emailOtpService.verifyOtp("test@example.com", "123456", "REGISTRATION")).thenReturn(true);

        Map<String, String> payload = Map.of(
                "email", "test@example.com",
                "otpCode", "123456",
                "purpose", "REGISTRATION"
        );

        ResponseEntity<?> response = authController.verifyOtp(payload);
        assertEquals(200, response.getStatusCode().value());
        verify(userService, times(1)).activateUser("test@example.com");
    }

    @Test
    void testHealthCheck() {
        ResponseEntity<?> response = authController.health();
        assertEquals(200, response.getStatusCode().value());
    }
}
