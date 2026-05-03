package com.talkcs.backend.controller;

import com.talkcs.backend.dto.*;
import com.talkcs.backend.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import java.util.Map;

@RestController
@RequestMapping("/api/comments")
@RequiredArgsConstructor
public class CommentController{
    private final CommentService commentservice;
    private final SimpMessagingTemplate messagingTemplate;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getCommentsByPostId(
            @RequestParam Long postId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(commentservice.getCommentsByPostId(postId, page, size));
    }
    
    @PostMapping
    public ResponseEntity<CommentResponse> createComment(@Valid @RequestBody CommentRequest request){
        CommentResponse response = commentservice.createComment(request);
        messagingTemplate.convertAndSend("/topic/post/" + request.getPostId(),
                (Object) Map.of("action", "created", "comment", response));
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CommentResponse> editComment(@PathVariable Long id, @Valid @RequestBody CommentRequest request) {
        CommentResponse response = commentservice.editComment(id, request);
        messagingTemplate.convertAndSend("/topic/post/" + request.getPostId(),
                (Object) Map.of("action", "updated", "comment", response));
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteComment(@PathVariable Long id) {
        Long postId = commentservice.deleteComment(id);
        messagingTemplate.convertAndSend("/topic/post/" + postId,
                (Object) Map.of("action", "deleted", "commentId", id));
        return ResponseEntity.noContent().build();
    }
}