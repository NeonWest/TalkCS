package com.talkcs.backend.controller;

import com.talkcs.backend.dto.CommentRequest;
import com.talkcs.backend.dto.CommentResponse;
import com.talkcs.backend.security.JwtAuthFilter;
import com.talkcs.backend.security.JwtUtils;
import com.talkcs.backend.service.CommentService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(CommentController.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
class CommentControllerTests {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @MockitoBean private CommentService commentservice;
    @MockitoBean private SimpMessagingTemplate messagingTemplate;
    @MockitoBean private JwtUtils jwtUtils;
    @MockitoBean private JwtAuthFilter jwtAuthFilter;
    @MockitoBean private UserDetailsService userDetailsService;

    @Test
    void getComments_returns200() throws Exception {
        when(commentservice.getCommentsByPostId(anyLong(), anyInt(), anyInt())).thenReturn(Map.of("totalItems", 0L));
        mockMvc.perform(get("/api/comments").param("postId", "1"))
            .andExpect(status().isOk());
    }

    @Test
    void createComment_returns200() throws Exception {
        CommentRequest req = new CommentRequest();
        req.setPostId(1L); req.setBody("body");
        when(commentservice.createComment(any())).thenReturn(CommentResponse.builder().id(5L).body("body").build());

        mockMvc.perform(post("/api/comments")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(5));
    }

    @Test
    void deleteComment_returns204() throws Exception {
        when(commentservice.deleteComment(1L)).thenReturn(1L);
        mockMvc.perform(delete("/api/comments/1")).andExpect(status().isNoContent());
        verify(commentservice).deleteComment(1L);
    }
}
