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
    private final CommentRepository commentrepository;

    public UserResponse getUserProfile(String username) {
        User user = userrepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));
        int rep = user.getReputation();
        return UserResponse.builder()
            .id(user.getId())
            .username(user.getUsername())
            .createdAt(user.getCreatedAt())
            .role(user.getRole())
            .postCount(postrepository.countByAuthorId(user.getId()))
            .commentCount(commentrepository.countByAuthorId(user.getId()))
            .reputation(rep)
            .level(getLevelNumber(rep))
            .levelTitle(getLevelTitle(rep))
            .nextLevelRepRequired(getNextLevelRep(rep))
            .build();
    }

    public static int getLevelNumber(int rep) {
        if (rep >= 1000) return 5;
        if (rep >= 500)  return 4;
        if (rep >= 200)  return 3;
        if (rep >= 50)   return 2;
        return 1;
    }

    public static String getLevelTitle(int rep) {
        if (rep >= 1000) return "Expert";
        if (rep >= 500)  return "Trusted";
        if (rep >= 200)  return "Regular";
        if (rep >= 50)   return "Contributor";
        return "Newcomer";
    }

    public static Integer getNextLevelRep(int rep) {
        if (rep >= 1000) return null;
        if (rep >= 500)  return 1000;
        if (rep >= 200)  return 500;
        if (rep >= 50)   return 200;
        return 50;
    }

    public List<UserResponse> getLeaderboard() {
        return userrepository.findTop20ByOrderByReputationDesc().stream()
            .map(u -> UserResponse.builder()
                .id(u.getId())
                .username(u.getUsername())
                .reputation(u.getReputation())
                .level(getLevelNumber(u.getReputation()))
                .levelTitle(getLevelTitle(u.getReputation()))
                .role(u.getRole())
                .build())
            .toList();
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