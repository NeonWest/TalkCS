package com.talkcs.backend.controller;

import com.talkcs.backend.dto.*;
import com.talkcs.backend.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import com.talkcs.backend.dto.SimilarPostResponse;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController{
    private final PostService postservice;
    private final SimilarityService similarityService;
    private final SimpMessagingTemplate messagingTemplate;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllPostsByCategoryId(
        @RequestParam Long categoryId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size,
        @RequestParam(defaultValue = "newest") String sortBy) {
        return ResponseEntity.ok(postservice.getAllPostsByCategoryId(categoryId, page, size, sortBy));
    }
    
    @PostMapping
    public ResponseEntity<PostResponse> createPost(@Valid @RequestBody PostRequest request){
        PostResponse response = postservice.createPost(request);
        messagingTemplate.convertAndSend("/topic/category/" + request.getCategoryId(),
                (Object) Map.of("action", "created", "post", response));
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PostResponse> getPostById(@PathVariable Long id) {
        return ResponseEntity.ok(postservice.getPostById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PostResponse> editPost(@PathVariable Long id, @Valid @RequestBody PostRequest request) {
        PostResponse response = postservice.editPost(id, request);
        messagingTemplate.convertAndSend("/topic/category/" + request.getCategoryId(),
                (Object) Map.of("action", "updated", "post", response));
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePost(@PathVariable Long id) {
        PostResponse post = postservice.getPostById(id);
        postservice.deletePost(id);
        messagingTemplate.convertAndSend("/topic/category/" + post.getCategoryId(),
                (Object) Map.of("action", "deleted", "postId", id));
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<PostResponse> setStatus(@PathVariable Long id, @RequestBody java.util.Map<String, String> body) {
        return ResponseEntity.ok(postservice.setStatus(id, body.get("status")));
    }

    @GetMapping("/trending")
    public ResponseEntity<List<PostResponse>> getTrending(
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(postservice.getTrendingPosts(limit));
    }

    @PostMapping("/{id}/bookmark")
    public ResponseEntity<Void> bookmark(@PathVariable Long id) {
        postservice.bookmarkPost(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}/bookmark")
    public ResponseEntity<Void> unbookmark(@PathVariable Long id) {
        postservice.unbookmarkPost(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/similar")
    public ResponseEntity<List<SimilarPostResponse>> getSimilar(
            @RequestParam String title,
            @RequestParam(required = false, defaultValue = "") String body,
            @RequestParam Long categoryId,
            @RequestParam(required = false) List<String> tags) {
        return ResponseEntity.ok(similarityService.findSimilar(title, body, categoryId, tags));
    }

    @PutMapping("/{id}/accept/{commentId}")
    public ResponseEntity<PostResponse> acceptAnswer(@PathVariable Long id, @PathVariable Long commentId) {
        return ResponseEntity.ok(postservice.acceptAnswer(id, commentId));
    }
}