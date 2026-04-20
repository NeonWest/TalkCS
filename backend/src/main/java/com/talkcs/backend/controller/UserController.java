package com.talkcs.backend.controller;
import com.talkcs.backend.dto.*;
import com.talkcs.backend.service.*;
import com.talkcs.backend.service.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.UrlResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.Path;
import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userservice;
    private final PostService postservice;

    @GetMapping("/search")
    public ResponseEntity<List<UserResponse>> searchUsers(@RequestParam String q) {
        return ResponseEntity.ok(userservice.searchUsersForChat(q));
    }

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

    @PutMapping("/me")
    public ResponseEntity<UserResponse> updateProfile(@RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(userservice.updateProfile(request.getBio()));
    }

    @PutMapping("/me/avatar")
    public ResponseEntity<java.util.Map<String, String>> uploadAvatar(@RequestParam("file") MultipartFile file) throws IOException {
        String avatarUrl = userservice.uploadAvatar(file);
        return ResponseEntity.ok(java.util.Map.of("avatarUrl", avatarUrl));
    }

    @GetMapping("/{username}/avatar")
    public ResponseEntity<org.springframework.core.io.Resource> getAvatar(@PathVariable String username) {
        try {
            Path path = userservice.getAvatarPath(username);
            org.springframework.core.io.Resource resource = new UrlResource(path.toUri());
            if (!resource.exists()) return ResponseEntity.notFound().build();
            String contentType = path.toString().toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
            return ResponseEntity.ok().contentType(MediaType.parseMediaType(contentType)).body(resource);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}