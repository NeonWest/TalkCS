package com.talkcs.backend.controller;

import com.talkcs.backend.model.User;
import com.talkcs.backend.repository.UserRepository;
import com.talkcs.backend.security.JwtAuthFilter;
import com.talkcs.backend.security.JwtUtils;
import com.talkcs.backend.service.NotificationService;
import com.talkcs.backend.testsupport.SecurityTestSupport;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(NotificationController.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
class NotificationControllerTests {

    @Autowired private MockMvc mockMvc;
    @MockitoBean private NotificationService notificationService;
    @MockitoBean private UserRepository userRepository;
    @MockitoBean private JwtUtils jwtUtils;
    @MockitoBean private JwtAuthFilter jwtAuthFilter;
    @MockitoBean private UserDetailsService userDetailsService;

    @BeforeEach
    void auth() {
        SecurityTestSupport.setAuth("u@t.com");
        when(userRepository.findByEmail("u@t.com")).thenReturn(Optional.of(User.builder().id(1L).build()));
    }
    @AfterEach
    void clearAuth() { SecurityTestSupport.clear(); }

    @Test
    void getAll_returns200() throws Exception {
        when(notificationService.getForUser(1L)).thenReturn(List.of());
        mockMvc.perform(get("/api/notifications")).andExpect(status().isOk());
    }

    @Test
    void getUnreadCount_returns200() throws Exception {
        when(notificationService.countUnread(1L)).thenReturn(3L);
        mockMvc.perform(get("/api/notifications/count")).andExpect(status().isOk());
    }

    @Test
    void markRead_returns200() throws Exception {
        mockMvc.perform(put("/api/notifications/5/read")).andExpect(status().isOk());
        verify(notificationService).markRead(5L);
    }

    @Test
    void markAllRead_returns200() throws Exception {
        mockMvc.perform(put("/api/notifications/read-all")).andExpect(status().isOk());
        verify(notificationService).markAllRead(1L);
    }
}
