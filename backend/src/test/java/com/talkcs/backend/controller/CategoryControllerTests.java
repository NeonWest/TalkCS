package com.talkcs.backend.controller;

import com.talkcs.backend.dto.CategoryRequest;
import com.talkcs.backend.dto.CategoryResponse;
import com.talkcs.backend.security.JwtAuthFilter;
import com.talkcs.backend.security.JwtUtils;
import com.talkcs.backend.service.CategoryService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(CategoryController.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
class CategoryControllerTests {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @MockitoBean private CategoryService categoryservice;
    @MockitoBean private JwtUtils jwtUtils;
    @MockitoBean private JwtAuthFilter jwtAuthFilter;
    @MockitoBean private UserDetailsService userDetailsService;

    @Test
    void getAllCategories_returns200() throws Exception {
        when(categoryservice.getAllCategories()).thenReturn(List.of(
            CategoryResponse.builder().id(1L).name("X").build()));
        mockMvc.perform(get("/api/categories"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].name").value("X"));
    }

    @Test
    void getCategoryById_returns200() throws Exception {
        when(categoryservice.getCategoryById(1L)).thenReturn(CategoryResponse.builder().id(1L).build());
        mockMvc.perform(get("/api/categories/1")).andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createCategory_returns200ForAdmin() throws Exception {
        CategoryRequest req = new CategoryRequest();
        req.setName("Tech"); req.setDescription("d");
        when(categoryservice.createCategory(any())).thenReturn(CategoryResponse.builder().id(1L).name("Tech").build());

        mockMvc.perform(post("/api/categories")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isOk());
    }
}
