package com.talkcs.backend.controller;

import com.talkcs.backend.security.JwtAuthFilter;
import com.talkcs.backend.security.JwtUtils;
import com.talkcs.backend.service.CalendarService;
import com.talkcs.backend.testsupport.MethodSecurityTestConfig;
import com.talkcs.backend.testsupport.SecurityTestSupport;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CalendarController.class)
@Import(MethodSecurityTestConfig.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
class CalendarControllerTests {

    @Autowired private MockMvc mockMvc;
    @MockitoBean private CalendarService calendarService;
    @MockitoBean private JwtUtils jwtUtils;
    @MockitoBean private JwtAuthFilter jwtAuthFilter;
    @MockitoBean private UserDetailsService userDetailsService;

    @BeforeEach
    void auth() { SecurityTestSupport.setAuth("me@t.com"); }
    @AfterEach
    void clearAuth() { SecurityTestSupport.clear(); }

    @Test
    void getEventsByMonth_returns200() throws Exception {
        when(calendarService.getEventsByMonth(eq(2026), eq(5), any(), any())).thenReturn(Map.of("events", java.util.List.of()));
        mockMvc.perform(get("/api/calendar").param("year", "2026").param("month", "5"))
            .andExpect(status().isOk());
    }

    @Test
    void getUpcoming_returns200() throws Exception {
        when(calendarService.getUpcomingEvents(any(), anyInt())).thenReturn(Map.of("events", java.util.List.of()));
        mockMvc.perform(get("/api/calendar/upcoming")).andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "STUDENT")
    void approveProposal_returns403ForStudent() throws Exception {
        mockMvc.perform(put("/api/calendar/proposals/1/approve")).andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "STUDENT")
    void getPendingProposals_returns403ForStudent() throws Exception {
        mockMvc.perform(get("/api/calendar/proposals")).andExpect(status().isForbidden());
    }
}
