package com.talkcs.backend.controller;

import com.talkcs.backend.dto.SearchResponse;
import com.talkcs.backend.security.JwtAuthFilter;
import com.talkcs.backend.security.JwtUtils;
import com.talkcs.backend.service.SearchService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(SearchController.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
class SearchControllerTests {

    @Autowired private MockMvc mockMvc;
    @MockitoBean private SearchService searchService;
    @MockitoBean private JwtUtils jwtUtils;
    @MockitoBean private JwtAuthFilter jwtAuthFilter;
    @MockitoBean private UserDetailsService userDetailsService;

    @Test
    void search_returns200() throws Exception {
        when(searchService.search("q")).thenReturn(SearchResponse.builder().posts(List.of()).categories(List.of()).users(List.of()).build());
        mockMvc.perform(get("/api/search").param("q", "q"))
            .andExpect(status().isOk());
    }

    @Test
    void search_returns400WhenMissingQuery() throws Exception {
        mockMvc.perform(get("/api/search"))
            .andExpect(status().isBadRequest());
    }
}
