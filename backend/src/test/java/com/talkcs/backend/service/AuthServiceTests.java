package com.talkcs.backend.service;

import com.talkcs.backend.dto.AuthResponse;
import com.talkcs.backend.dto.LoginRequest;
import com.talkcs.backend.dto.RegisterRequest;
import com.talkcs.backend.model.User;
import com.talkcs.backend.repository.UserRepository;
import com.talkcs.backend.security.JwtUtils;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTests {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtUtils jwtUtils;
    @InjectMocks private AuthService authService;

    private RegisterRequest registerReq() {
        RegisterRequest r = new RegisterRequest();
        r.setUsername("newuser");
        r.setEmail("new@test.com");
        r.setPassword("Password1!");
        return r;
    }

    @Test
    void register_savesUserAndReturnsToken() {
        RegisterRequest req = registerReq();
        when(userRepository.existsByEmail(req.getEmail())).thenReturn(false);
        when(userRepository.existsByUsername(req.getUsername())).thenReturn(false);
        when(passwordEncoder.encode("Password1!")).thenReturn("ENC");
        when(jwtUtils.generateToken(req.getEmail())).thenReturn("token123");

        AuthResponse res = authService.register(req);

        assertThat(res.getUsername()).isEqualTo("newuser");
        assertThat(res.getToken()).isEqualTo("token123");
        assertThat(res.getRole()).isEqualTo("STUDENT");
        verify(userRepository).save(any(User.class));
    }

    @Test
    void register_throwsWhenEmailExists() {
        RegisterRequest req = registerReq();
        when(userRepository.existsByEmail(req.getEmail())).thenReturn(true);

        assertThatThrownBy(() -> authService.register(req))
            .hasMessage("Email already exists");
        verify(userRepository, never()).save(any());
    }

    @Test
    void register_throwsWhenUsernameExists() {
        RegisterRequest req = registerReq();
        when(userRepository.existsByEmail(any())).thenReturn(false);
        when(userRepository.existsByUsername(req.getUsername())).thenReturn(true);

        assertThatThrownBy(() -> authService.register(req))
            .hasMessage("Username already exists");
        verify(userRepository, never()).save(any());
    }

    @Test
    void login_returnsTokenForValidCredentials() {
        LoginRequest req = new LoginRequest();
        req.setEmail("user@test.com");
        req.setPassword("ok");

        User u = User.builder().id(7L).email("user@test.com").username("user").password("ENC").role("STUDENT").build();
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(u));
        when(passwordEncoder.matches("ok", "ENC")).thenReturn(true);
        when(jwtUtils.generateToken("user@test.com")).thenReturn("tkn");

        AuthResponse res = authService.login(req);

        assertThat(res.getToken()).isEqualTo("tkn");
        assertThat(res.getId()).isEqualTo(7L);
    }

    @Test
    void login_throwsWhenUserNotFound() {
        LoginRequest req = new LoginRequest();
        req.setEmail("nobody@test.com");
        req.setPassword("x");
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(req))
            .hasMessage("Invalid credentials");
    }

    @Test
    void login_throwsWhenPasswordWrong() {
        LoginRequest req = new LoginRequest();
        req.setEmail("user@test.com");
        req.setPassword("wrong");
        User u = User.builder().email("user@test.com").password("ENC").build();
        when(userRepository.findByEmail(any())).thenReturn(Optional.of(u));
        when(passwordEncoder.matches("wrong", "ENC")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(req))
            .hasMessage("Invalid credentials");
    }
}
