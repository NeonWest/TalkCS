package com.talkcs.backend.controller;

import com.talkcs.backend.security.JwtAuthFilter;
import com.talkcs.backend.security.JwtUtils;
import com.talkcs.backend.service.ResourceService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ResourceController.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
class ResourceControllerTests {

    @Autowired private MockMvc mockMvc;
    @MockitoBean private ResourceService resourceService;
    @MockitoBean private JwtUtils jwtUtils;
    @MockitoBean private JwtAuthFilter jwtAuthFilter;
    @MockitoBean private UserDetailsService userDetailsService;

    @Test
    void getByCategory_returns200() throws Exception {
        when(resourceService.getResourcesByCategory(1L)).thenReturn(List.of());
        mockMvc.perform(get("/api/resources").param("categoryId", "1"))
            .andExpect(status().isOk());
    }

    @Test
    void trending_returns200() throws Exception {
        when(resourceService.getTrendingResources(anyInt())).thenReturn(List.of());
        mockMvc.perform(get("/api/resources/trending")).andExpect(status().isOk());
    }

    @Test
    void delete_returns204() throws Exception {
        mockMvc.perform(delete("/api/resources/1")).andExpect(status().isNoContent());
        verify(resourceService).deleteResource(1L);
    }
}
