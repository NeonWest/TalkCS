package com.talkcs.backend.controller;
import com.talkcs.backend.dto.*;
import com.talkcs.backend.service.*;
import com.talkcs.backend.service.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userservice;
    private final PostService postservice;

    @GetMapping("/{username}")
    public ResponseEntity<UserResponse> getUserProfile(@PathVariable String username) {
        return ResponseEntity.ok(userservice.getUserProfile(username));
    }

    @GetMapping("/{username}/posts")
    public ResponseEntity<List<PostResponse>> getUserPosts(@PathVariable String username) {
        return ResponseEntity.ok(userservice.getUserPosts(username));
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<List<UserResponse>> getLeaderboard() {
        return ResponseEntity.ok(userservice.getLeaderboard());
    }

    @GetMapping("/{username}/bookmarks")
    public ResponseEntity<List<PostResponse>> getBookmarks(@PathVariable String username) {
        return ResponseEntity.ok(postservice.getUserBookmarks(username));
    }

    @PostMapping("/{username}/follow")
    public ResponseEntity<Void> follow(@PathVariable String username) {
        userservice.followUser(username);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{username}/follow")
    public ResponseEntity<Void> unfollow(@PathVariable String username) {
        userservice.unfollowUser(username);
        return ResponseEntity.ok().build();
    }
}