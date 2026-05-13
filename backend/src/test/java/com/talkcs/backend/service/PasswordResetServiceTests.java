package com.talkcs.backend.service;

import com.talkcs.backend.model.PasswordResetToken;
import com.talkcs.backend.model.User;
import com.talkcs.backend.repository.PasswordResetTokenRepository;
import com.talkcs.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PasswordResetServiceTests {

    @Mock private PasswordResetTokenRepository tokenRepository;
    @Mock private UserRepository userRepository;
    @Mock private EmailService emailService;
    @Mock private PasswordEncoder passwordEncoder;
    @InjectMocks private PasswordResetService passwordResetService;

    @Test
    void requestReset_silentlyIgnoresUnknownEmail() {
        when(userRepository.findByEmail("ghost@t.com")).thenReturn(Optional.empty());

        passwordResetService.requestReset("ghost@t.com");

        verify(tokenRepository, never()).save(any());
        verify(emailService, never()).sendNotificationEmail(any(), any(), any());
    }

    @Test
    void requestReset_savesTokenAndSendsEmail() {
        User u = User.builder().id(1L).email("u@t.com").username("u").build();
        when(userRepository.findByEmail("u@t.com")).thenReturn(Optional.of(u));

        passwordResetService.requestReset("u@t.com");

        verify(tokenRepository).deleteByUser(u);
        verify(tokenRepository).save(any(PasswordResetToken.class));
        verify(emailService).sendNotificationEmail(eq(u), any(), any());
    }

    @Test
    void resetPassword_throwsForInvalidToken() {
        when(tokenRepository.findByToken("bad")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> passwordResetService.resetPassword("bad", "newpw"))
            .hasMessage("Invalid or expired token");
    }

    @Test
    void resetPassword_throwsForUsedToken() {
        PasswordResetToken t = PasswordResetToken.builder().token("x").used(true)
            .expiresAt(LocalDateTime.now().plusHours(1)).build();
        when(tokenRepository.findByToken("x")).thenReturn(Optional.of(t));
        assertThatThrownBy(() -> passwordResetService.resetPassword("x", "pw"))
            .hasMessage("Invalid or expired token");
    }

    @Test
    void resetPassword_throwsForExpiredToken() {
        PasswordResetToken t = PasswordResetToken.builder().token("x").used(false)
            .expiresAt(LocalDateTime.now().minusMinutes(1)).build();
        when(tokenRepository.findByToken("x")).thenReturn(Optional.of(t));
        assertThatThrownBy(() -> passwordResetService.resetPassword("x", "pw"))
            .hasMessage("Invalid or expired token");
    }

    @Test
    void resetPassword_updatesPasswordAndMarksUsed() {
        User u = User.builder().id(1L).email("u@t.com").build();
        PasswordResetToken t = PasswordResetToken.builder().token("ok").used(false).user(u)
            .expiresAt(LocalDateTime.now().plusHours(1)).build();
        when(tokenRepository.findByToken("ok")).thenReturn(Optional.of(t));
        when(passwordEncoder.encode("pw")).thenReturn("ENC");

        passwordResetService.resetPassword("ok", "pw");

        assertThat(u.getPassword()).isEqualTo("ENC");
        assertThat(t.isUsed()).isTrue();
        verify(userRepository).save(u);
        verify(tokenRepository).save(t);
    }
}
