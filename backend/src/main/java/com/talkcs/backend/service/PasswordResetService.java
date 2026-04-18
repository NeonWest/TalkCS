package com.talkcs.backend.service;

import com.talkcs.backend.model.PasswordResetToken;
import com.talkcs.backend.model.User;
import com.talkcs.backend.repository.PasswordResetTokenRepository;
import com.talkcs.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public void requestReset(String email) {
        // Silently do nothing if email not found (don't reveal user existence)
        var userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return;
        }

        User user = userOpt.get();

        // Delete any existing tokens for this user
        passwordResetTokenRepository.deleteByUser(user);

        // Generate UUID token
        String token = UUID.randomUUID().toString();

        // Create and save reset token (expires in 1 hour)
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .token(token)
                .user(user)
                .expiresAt(LocalDateTime.now().plusHours(1))
                .used(false)
                .build();
        passwordResetTokenRepository.save(resetToken);

        // Send email
        String resetLink = "http://localhost:5173/reset-password?token=" + token;
        String emailBody = "Click the link below to reset your TalkCS password:\n\n" + resetLink;
        try {
            emailService.sendNotificationEmail(
                    user,
                    "Reset your TalkCS password",
                    emailBody
            );
        } catch (Exception e) {
            log.warn("Failed to send reset email to {}: {}", email, e.getMessage());
        }
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        var tokenOpt = passwordResetTokenRepository.findByToken(token);

        if (tokenOpt.isEmpty()) {
            throw new RuntimeException("Invalid or expired token");
        }

        PasswordResetToken resetToken = tokenOpt.get();

        // Check if token is already used
        if (resetToken.isUsed()) {
            throw new RuntimeException("Invalid or expired token");
        }

        // Check if token has expired
        if (resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Invalid or expired token");
        }

        // Update user password
        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Mark token as used
        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);

        log.info("Password reset successfully for user: {}", user.getUsername());
    }
}
