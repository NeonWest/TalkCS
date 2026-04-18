package com.talkcs.backend.controller;

import com.talkcs.backend.dto.*;
import com.talkcs.backend.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
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
        return ResponseEntity.ok(postservice.createPost(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PostResponse> getPostById(@PathVariable Long id) {
        return ResponseEntity.ok(postservice.getPostById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PostResponse> editPost(@PathVariable Long id, @Valid @RequestBody PostRequest request) {
        return ResponseEntity.ok(postservice.editPost(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePost(@PathVariable Long id) {
        postservice.deletePost(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<PostResponse> setStatus(@PathVariable Long id, @RequestBody java.util.Map<String, String> body) {
        return ResponseEntity.ok(postservice.setStatus(id, body.get("status")));
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