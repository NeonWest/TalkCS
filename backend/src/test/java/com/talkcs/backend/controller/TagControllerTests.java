package com.talkcs.backend.controller;

import com.talkcs.backend.model.Tag;
import com.talkcs.backend.security.JwtAuthFilter;
import com.talkcs.backend.security.JwtUtils;
import com.talkcs.backend.service.TagService;
import com.talkcs.backend.service.TagSuggestionService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(TagController.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
class TagControllerTests {

    @Autowired private MockMvc mockMvc;
    @MockitoBean private TagService tagService;
    @MockitoBean private TagSuggestionService tagSuggestionService;
    @MockitoBean private JwtUtils jwtUtils;
    @MockitoBean private JwtAuthFilter jwtAuthFilter;
    @MockitoBean private UserDetailsService userDetailsService;

    @Test
    void getAllTags_returns200() throws Exception {
        when(tagService.getAllTags()).thenReturn(List.of(Tag.builder().name("java").build()));
        mockMvc.perform(get("/api/tags"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0]").value("java"));
    }

    @Test
    void getPopularTags_returns200() throws Exception {
        when(tagService.getPopularTags()).thenReturn(List.of());
        mockMvc.perform(get("/api/tags/popular")).andExpect(status().isOk());
    }

    @Test
    void suggest_returns200() throws Exception {
        when(tagSuggestionService.suggest("t", "b")).thenReturn(List.of("java"));
        mockMvc.perform(post("/api/tags/suggest")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"t\",\"body\":\"b\"}"))
            .andExpect(status().isOk());
    }
}
