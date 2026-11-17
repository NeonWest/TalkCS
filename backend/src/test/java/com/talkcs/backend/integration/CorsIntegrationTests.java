package com.talkcs.backend.integration;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "app.base-url=https://talkcs.example.org")
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CorsIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void preflight_fromConfiguredFrontend_isAllowed() throws Exception {
        mockMvc.perform(options("/api/auth/login")
                .header("Origin", "https://talkcs.example.org")
                .header("Access-Control-Request-Method", "POST"))
            .andExpect(status().isOk())
            .andExpect(header().string("Access-Control-Allow-Origin", "https://talkcs.example.org"));
    }

    @Test
    void preflight_fromLocalDevServer_isAllowed() throws Exception {
        mockMvc.perform(options("/api/auth/login")
                .header("Origin", "http://localhost:5173")
                .header("Access-Control-Request-Method", "POST"))
            .andExpect(status().isOk())
            .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"));
    }

    @Test
    void preflight_fromUnknownOrigin_isRejected() throws Exception {
        mockMvc.perform(options("/api/auth/login")
                .header("Origin", "https://evil.example.com")
                .header("Access-Control-Request-Method", "POST"))
            .andExpect(status().isForbidden())
            .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
    }
}
