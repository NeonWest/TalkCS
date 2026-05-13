package com.talkcs.backend.controller;

import com.talkcs.backend.dto.VoteRequest;
import com.talkcs.backend.security.JwtAuthFilter;
import com.talkcs.backend.security.JwtUtils;
import com.talkcs.backend.service.VoteService;
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

import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(VoteController.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
class VoteControllerTests {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @MockitoBean private VoteService voteservice;
    @MockitoBean private JwtUtils jwtUtils;
    @MockitoBean private JwtAuthFilter jwtAuthFilter;
    @MockitoBean private UserDetailsService userDetailsService;

    @Test
    void voteOnPost_returns200() throws Exception {
        VoteRequest req = new VoteRequest();
        req.setValue(1);
        mockMvc.perform(post("/api/votes/post/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isOk());
        verify(voteservice).voteOnPost(1L, 1);
    }

    @Test
    void voteOnComment_returns200() throws Exception {
        VoteRequest req = new VoteRequest();
        req.setValue(-1);
        mockMvc.perform(post("/api/votes/comment/2")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isOk());
        verify(voteservice).voteOnComment(2L, -1);
    }

    @Test
    void voteOnResource_returns200() throws Exception {
        VoteRequest req = new VoteRequest();
        req.setValue(1);
        mockMvc.perform(post("/api/votes/resource/3")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isOk());
        verify(voteservice).voteOnResource(3L, 1);
    }
}
