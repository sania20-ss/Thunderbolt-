package com.auth.service;

import com.auth.model.EmailOtp;
import com.auth.repository.EmailOtpRepository;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
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

    @Value("${spring.mail.username:}")
    private String mailFromAddress;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    private final SecureRandom secureRandom = new SecureRandom();

    /**
     * Generates a 6-digit OTP, persists it in MySQL, and dispatches via SMTP email.
     */
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

        // Attempt real SMTP dispatch if credentials are configured
        boolean mailSent = false;
        if (mailSender != null && mailFromAddress != null && !mailFromAddress.isBlank() && mailPassword != null && !mailPassword.isBlank()) {
            try {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
                helper.setFrom(mailFromAddress);
                helper.setTo(email);
                helper.setSubject("SecureAuth Verification Code: " + otpCode);
                helper.setText(
                    """
                    <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;'>
                        <h2 style='color: #4f46e5; margin-bottom: 8px;'>SecureAuth Security Verification</h2>
                        <p style='color: #475569; font-size: 14px;'>You requested a verification code for <strong>%s</strong>.</p>
                        <div style='background: #f8fafc; border: 1px solid #cbd5e1; padding: 18px; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; color: #0f172a; margin: 24px 0;'>
                            %s
                        </div>
                        <p style='color: #64748b; font-size: 13px;'>This code is valid for 5 minutes. If you did not make this request, please ignore this email.</p>
                    </div>
                    """.formatted(purpose, otpCode),
                    true
                );
                mailSender.send(message);
                mailSent = true;
                log.info(">>> [SMTP SUCCESS] Real email OTP dispatched to {}", email);
            } catch (Exception ex) {
                log.warn(">>> [SMTP ERROR] Could not send email via Gmail SMTP: {}. Falling back to console/response display.", ex.getMessage());
            }
        }

        if (!mailSent) {
            log.info("=================================================================");
            log.info(">>> [EMAIL OTP DISPATCH] Verification Code for [{}] ({}): {}", email, purpose, otpCode);
            log.info(">>> (To send to real inbox, set spring.mail.username & spring.mail.password in application.properties)");
            log.info("=================================================================");
        }

        return otpCode;
    }

    /**
     * Verifies the submitted OTP against MySQL records.
     */
    @Transactional
    public boolean verifyOtp(String email, String otpCode, String purpose) {
        return validateOtp(email, otpCode, purpose);
    }

    @Transactional
    public boolean validateOtp(String email, String otpCode, String purpose) {
        if (email == null || otpCode == null || email.isBlank() || otpCode.isBlank()) {
            return false;
        }

        String searchPurpose = (purpose == null || purpose.isBlank()) ? "REGISTRATION" : purpose.toUpperCase();

        return otpRepository.findTopByEmailAndPurposeOrderByCreatedAtDesc(email.trim(), searchPurpose)
            .map(otp -> {
                if (otp.isVerified()) {
                    return false;
                }
                if (LocalDateTime.now().isAfter(otp.getExpiresAt())) {
                    return false;
                }

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
}
