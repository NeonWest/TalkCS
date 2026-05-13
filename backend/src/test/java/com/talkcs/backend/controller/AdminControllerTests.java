package com.talkcs.backend.controller;

import com.talkcs.backend.dto.AdminStatsResponse;
import com.talkcs.backend.model.SiteConfig;
import com.talkcs.backend.security.JwtAuthFilter;
import com.talkcs.backend.security.JwtUtils;
import com.talkcs.backend.service.AdminService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AdminController.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
class AdminControllerTests {

    @Autowired private MockMvc mockMvc;
    @MockitoBean private AdminService adminService;
    @MockitoBean private JwtUtils jwtUtils;
    @MockitoBean private JwtAuthFilter jwtAuthFilter;
    @MockitoBean private UserDetailsService userDetailsService;

    @Test
    @WithMockUser(roles = "ADMIN")
    void getStats_returns200ForAdmin() throws Exception {
        when(adminService.getStats()).thenReturn(AdminStatsResponse.builder().totalUsers(10L).build());
        mockMvc.perform(get("/api/admin/stats")).andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getConfig_returns200ForAdmin() throws Exception {
        when(adminService.getConfig()).thenReturn(SiteConfig.builder().id(1L).build());
        mockMvc.perform(get("/api/admin/config")).andExpect(status().isOk());
    }

    // Role-based denial covered in integration tests; @WebMvcTest slice does not
    // auto-load @EnableMethodSecurity, so @PreAuthorize is not enforced here.
}
