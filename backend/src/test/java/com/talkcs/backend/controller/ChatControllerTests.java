package com.talkcs.backend.controller;

import com.talkcs.backend.model.User;
import com.talkcs.backend.repository.UserRepository;
import com.talkcs.backend.security.JwtAuthFilter;
import com.talkcs.backend.security.JwtUtils;
import com.talkcs.backend.service.ChatService;
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

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ChatController.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
class ChatControllerTests {

    @Autowired private MockMvc mockMvc;
    @MockitoBean private ChatService chatService;
    @MockitoBean private UserRepository userRepository;
    @MockitoBean private JwtUtils jwtUtils;
    @MockitoBean private JwtAuthFilter jwtAuthFilter;
    @MockitoBean private UserDetailsService userDetailsService;

    @BeforeEach
    void auth() {
        SecurityTestSupport.setAuth("me@t.com");
        when(userRepository.findByEmail("me@t.com")).thenReturn(Optional.of(User.builder().id(1L).username("me").build()));
    }
    @AfterEach
    void clearAuth() { SecurityTestSupport.clear(); }

    @Test
    void getConversations_returns200() throws Exception {
        when(chatService.getConversations(org.mockito.ArgumentMatchers.any())).thenReturn(List.of());
        mockMvc.perform(get("/api/chat/conversations")).andExpect(status().isOk());
    }

    @Test
    void getUnreadCount_returns200() throws Exception {
        when(chatService.getUnreadCount(org.mockito.ArgumentMatchers.any())).thenReturn(2L);
        mockMvc.perform(get("/api/chat/unread-count")).andExpect(status().isOk());
    }

    @Test
    void getMessages_returns200() throws Exception {
        when(chatService.getMessages(1L)).thenReturn(List.of());
        mockMvc.perform(get("/api/chat/conversations/1/messages")).andExpect(status().isOk());
    }
}
