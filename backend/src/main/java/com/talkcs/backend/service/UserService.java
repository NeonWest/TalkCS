package com.talkcs.backend.service;
import com.talkcs.backend.dto.*;
import com.talkcs.backend.repository.*;
import com.talkcs.backend.model.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userrepository;
    private final PostRepository postrepository;

    public UserResponse getUserProfile(String username) {
        User user = userrepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));
        return UserResponse.builder()
            .id(user.getId())
            .username(user.getUsername())
            .createdAt(user.getCreatedAt())
            .role(user.getRole())
            .postCount(postrepository.countByAuthorId(user.getId()))
            .build();
    }

    public List<PostResponse> getUserPosts(String username) {
        User user = userrepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));
        return postrepository.findByAuthorId(user.getId())
            .stream()
            .map(post -> PostResponse.builder()
                .id(post.getId())
                .title(post.getTitle())
                .body(post.getBody())
                .authorUsername(post.getAuthor().getUsername())
                .createdAt(post.getCreatedAt())
                .build())
            .toList();
    }
}