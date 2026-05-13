package com.talkcs.backend.controller;

import com.talkcs.backend.dto.PostRequest;
import com.talkcs.backend.dto.PostResponse;
import com.talkcs.backend.security.JwtAuthFilter;
import com.talkcs.backend.security.JwtUtils;
import com.talkcs.backend.service.PostService;
import com.talkcs.backend.service.SimilarityService;
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

import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PostController.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
class PostControllerTests {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @MockitoBean private PostService postservice;
    @MockitoBean private SimilarityService similarityService;
    @MockitoBean private SimpMessagingTemplate messagingTemplate;
    @MockitoBean private JwtUtils jwtUtils;
    @MockitoBean private JwtAuthFilter jwtAuthFilter;
    @MockitoBean private UserDetailsService userDetailsService;

    @Test
    void getAllPosts_returns200() throws Exception {
        when(postservice.getAllPostsByCategoryId(any(), any(int.class), any(int.class), any()))
            .thenReturn(Map.of("posts", List.of(), "totalItems", 0L));

        mockMvc.perform(get("/api/posts").param("page", "0").param("size", "10"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalItems").value(0));
    }

    @Test
    void createPost_returns200() throws Exception {
        PostRequest req = new PostRequest();
        req.setTitle("t"); req.setBody("b"); req.setCategoryId(1L);
        when(postservice.createPost(any())).thenReturn(PostResponse.builder().id(1L).title("t").build());

        mockMvc.perform(post("/api/posts")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    void getPostById_returns200() throws Exception {
        when(postservice.getPostById(5L)).thenReturn(PostResponse.builder().id(5L).title("x").build());

        mockMvc.perform(get("/api/posts/5"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(5));
    }

    @Test
    void deletePost_returns204() throws Exception {
        when(postservice.getPostById(1L)).thenReturn(PostResponse.builder().id(1L).categoryId(1L).build());
        mockMvc.perform(delete("/api/posts/1"))
            .andExpect(status().isNoContent());
        verify(postservice).deletePost(1L);
    }

    @Test
    void bookmark_returns200() throws Exception {
        mockMvc.perform(post("/api/posts/1/bookmark")).andExpect(status().isOk());
        verify(postservice).bookmarkPost(1L);
    }

    @Test
    void trending_returns200() throws Exception {
        when(postservice.getTrendingPosts(anyInt())).thenReturn(List.of());
        mockMvc.perform(get("/api/posts/trending")).andExpect(status().isOk());
    }

    @Test
    void similar_returns200() throws Exception {
        when(similarityService.findSimilar(any(), any(), anyLong(), any())).thenReturn(List.of());
        mockMvc.perform(get("/api/posts/similar")
                .param("title", "x")
                .param("categoryId", "1"))
            .andExpect(status().isOk());
    }

    private int anyInt() { return org.mockito.ArgumentMatchers.anyInt(); }
}
