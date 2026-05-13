package com.talkcs.backend.controller;

import com.talkcs.backend.dto.UpdateProfileRequest;
import com.talkcs.backend.dto.UserResponse;
import com.talkcs.backend.security.JwtAuthFilter;
import com.talkcs.backend.security.JwtUtils;
import com.talkcs.backend.service.PostService;
import com.talkcs.backend.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UserController.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
class UserControllerTests {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @MockitoBean private UserService userservice;
    @MockitoBean private PostService postservice;
    @MockitoBean private JwtUtils jwtUtils;
    @MockitoBean private JwtAuthFilter jwtAuthFilter;
    @MockitoBean private UserDetailsService userDetailsService;

    @Test
    void getProfile_returns200() throws Exception {
        when(userservice.getUserProfile("alice")).thenReturn(UserResponse.builder().username("alice").build());
        mockMvc.perform(get("/api/users/alice"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.username").value("alice"));
    }

    @Test
    void leaderboard_returns200() throws Exception {
        when(userservice.getLeaderboard()).thenReturn(List.of());
        mockMvc.perform(get("/api/users/leaderboard")).andExpect(status().isOk());
    }

    @Test
    void searchUsers_returns200() throws Exception {
        when(userservice.searchUsersForChat("q")).thenReturn(List.of());
        mockMvc.perform(get("/api/users/search").param("q", "q")).andExpect(status().isOk());
    }

    @Test
    void follow_returns200() throws Exception {
        mockMvc.perform(post("/api/users/bob/follow")).andExpect(status().isOk());
        verify(userservice).followUser("bob");
    }

    @Test
    void unfollow_returns200() throws Exception {
        mockMvc.perform(delete("/api/users/bob/follow")).andExpect(status().isOk());
        verify(userservice).unfollowUser("bob");
    }

    @Test
    void updateProfile_returns200() throws Exception {
        UpdateProfileRequest req = new UpdateProfileRequest();
        req.setBio("hello");
        when(userservice.updateProfile(any())).thenReturn(UserResponse.builder().username("u").bio("hello").build());

        mockMvc.perform(put("/api/users/me")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.bio").value("hello"));
    }

    @Test
    void getCurrentUser_returns200() throws Exception {
        when(userservice.getCurrentUserProfile()).thenReturn(UserResponse.builder().username("me").build());
        mockMvc.perform(get("/api/users/me")).andExpect(status().isOk());
    }
}
