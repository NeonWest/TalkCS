package com.talkcs.backend.controller;

import com.talkcs.backend.dto.AuthResponse;
import com.talkcs.backend.dto.LoginRequest;
import com.talkcs.backend.dto.RegisterRequest;
import com.talkcs.backend.security.JwtAuthFilter;
import com.talkcs.backend.security.JwtUtils;
import com.talkcs.backend.service.AuthService;
import com.talkcs.backend.service.PasswordResetService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
class AuthControllerTests {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @MockitoBean private AuthService authService;
    @MockitoBean private PasswordResetService passwordResetService;
    @MockitoBean private JwtUtils jwtUtils;
    @MockitoBean private JwtAuthFilter jwtAuthFilter;
    @MockitoBean private UserDetailsService userDetailsService;

    @Test
    void register_returns200() throws Exception {
        RegisterRequest req = new RegisterRequest();
        req.setUsername("u"); req.setEmail("u@t.com"); req.setPassword("Password1!");
        when(authService.register(any())).thenReturn(AuthResponse.builder().username("u").token("tkn").build());

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token").value("tkn"));
    }

    @Test
    void register_returns400OnInvalidEmail() throws Exception {
        RegisterRequest req = new RegisterRequest();
        req.setUsername("u"); req.setEmail("not-email"); req.setPassword("Password1!");

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isBadRequest());
    }

    @Test
    void register_returns400OnShortPassword() throws Exception {
        RegisterRequest req = new RegisterRequest();
        req.setUsername("u"); req.setEmail("u@t.com"); req.setPassword("short");

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isBadRequest());
    }

    @Test
    void login_returns200() throws Exception {
        LoginRequest req = new LoginRequest();
        req.setEmail("u@t.com"); req.setPassword("Password1!");
        when(authService.login(any())).thenReturn(AuthResponse.builder().username("u").token("tkn").build());

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.username").value("u"));
    }

    @Test
    void forgotPassword_returns200Always() throws Exception {
        mockMvc.perform(post("/api/auth/forgot-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"any@t.com\"}"))
            .andExpect(status().isOk());
    }

    @Test
    void resetPassword_returns200OnValidToken() throws Exception {
        mockMvc.perform(post("/api/auth/reset-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"token\":\"abc\",\"newPassword\":\"pw\"}"))
            .andExpect(status().isOk());
    }
}
