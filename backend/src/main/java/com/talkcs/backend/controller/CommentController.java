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
@RequestMapping("/api/comments")
@RequiredArgsConstructor
public class CommentController{
    private final CommentService commentservice;

    @GetMapping
    public ResponseEntity<List<CommentResponse>> getCommentsByPostId(@RequestParam Long postId) {
        return ResponseEntity.ok(commentservice.getCommentsByPostId(postId));
    }
    
    @PostMapping
    public ResponseEntity<CommentResponse> createComment(@Valid @RequestBody CommentRequest request){
        return ResponseEntity.ok(commentservice.createComment(request));
    }
}