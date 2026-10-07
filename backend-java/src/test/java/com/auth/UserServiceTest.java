package com.auth;

import com.auth.model.User;
import com.auth.repository.UserRepository;
import com.auth.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Spy
    private PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @InjectMocks
    private UserService userService;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        sampleUser = User.builder()
                .id(1L)
                .username("johndoe")
                .email("john@example.com")
                .firstName("John")
                .lastName("Doe")
                .role("USER")
                .passwordHash(passwordEncoder.encode("SecretPass123!"))
                .salt("BCrypt")
                .isVerified(true)
                .status("ACTIVE")
                .build();
    }

    @Test
    void testRegisterUser_Success() {
        when(userRepository.existsByEmail("john@example.com")).thenReturn(false);
        when(userRepository.existsByUsername("johndoe")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Map<String, String> payload = Map.of(
                "username", "johndoe",
                "email", "john@example.com",
                "firstName", "John",
                "lastName", "Doe",
                "password", "SecretPass123!"
        );

        User registered = userService.registerUser(payload);
        assertNotNull(registered);
        assertEquals("johndoe", registered.getUsername());
        assertEquals("john@example.com", registered.getEmail());
        assertEquals("PENDING_OTP", registered.getStatus());
        assertFalse(registered.isVerified());
        assertTrue(passwordEncoder.matches("SecretPass123!", registered.getPasswordHash()));
    }

    @Test
    void testAuthenticate_Success() {
        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(sampleUser));

        Map<String, String> payload = Map.of(
                "email", "john@example.com",
                "password", "SecretPass123!"
        );

        Map<String, Object> response = userService.authenticate(payload);
        assertNotNull(response);
        assertEquals("Login successful", response.get("message"));
        assertEquals("john@example.com", response.get("email"));
        assertEquals("johndoe", response.get("username"));
    }

    @Test
    void testAuthenticate_InvalidPassword_ThrowsException() {
        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(sampleUser));

        Map<String, String> payload = Map.of(
                "email", "john@example.com",
                "password", "WrongPassword"
        );

        assertThrows(IllegalArgumentException.class, () -> userService.authenticate(payload));
    }
}
