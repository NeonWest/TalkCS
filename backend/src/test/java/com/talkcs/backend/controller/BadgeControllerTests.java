package com.talkcs.backend.controller;

import com.talkcs.backend.model.User;
import com.talkcs.backend.repository.UserRepository;
import com.talkcs.backend.security.JwtAuthFilter;
import com.talkcs.backend.security.JwtUtils;
import com.talkcs.backend.service.BadgeService;
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

@WebMvcTest(BadgeController.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
class BadgeControllerTests {

    @Autowired private MockMvc mockMvc;
    @MockitoBean private BadgeService badgeService;
    @MockitoBean private UserRepository userRepository;
    @MockitoBean private JwtUtils jwtUtils;
    @MockitoBean private JwtAuthFilter jwtAuthFilter;
    @MockitoBean private UserDetailsService userDetailsService;

    @Test
    void getBadges_returns200() throws Exception {
        when(userRepository.findByUsername("alice")).thenReturn(Optional.of(User.builder().id(1L).username("alice").build()));
        when(badgeService.getAllMilestoneBadgesForUser(1L)).thenReturn(List.of());
        when(badgeService.getSpecialBadgesForUser(1L)).thenReturn(List.of());

        mockMvc.perform(get("/api/users/alice/badges"))
            .andExpect(status().isOk());
    }
}
