package com.talkcs.backend.controller;
import com.talkcs.backend.service.VoteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.talkcs.backend.dto.VoteRequest;

@RestController
@RequestMapping("/api/votes")
@RequiredArgsConstructor
public class VoteController {
    private final VoteService voteservice;

    @PostMapping("/post/{postId}")
    public ResponseEntity<Void> voteOnPost(@PathVariable Long postId, @RequestBody VoteRequest request) {
        voteservice.voteOnPost(postId, request.getValue());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/comment/{commentId}")
    public ResponseEntity<Void> voteOnComment(@PathVariable Long commentId, @RequestBody VoteRequest request) {
        voteservice.voteOnComment(commentId, request.getValue());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/resource/{resourceId}")
    public ResponseEntity<Void> voteOnResource(@PathVariable Long resourceId, @RequestBody VoteRequest request) {
        voteservice.voteOnResource(resourceId, request.getValue());
        return ResponseEntity.ok().build();
    }
}