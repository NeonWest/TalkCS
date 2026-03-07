package com.talkcs.backend.controller;

import com.talkcs.backend.dto.*;
import com.talkcs.backend.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import java.util.List;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController{
    private final PostService postservice;

    @GetMapping
    public ResponseEntity<List<PostResponse>> getAllPostsByCategoryId(@RequestParam Long categoryId) {
        return ResponseEntity.ok(postservice.getAllPostsByCategoryId(categoryId));
    }
    
    @PostMapping
    public ResponseEntity<PostResponse> createPost(@Valid @RequestBody PostRequest request){
        return ResponseEntity.ok(postservice.createPost(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PostResponse> getPostById(@PathVariable Long id) {
        return ResponseEntity.ok(postservice.getPostById(id));
    }
}