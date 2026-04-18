package com.talkcs.backend.service;
import com.talkcs.backend.dto.*;
import com.talkcs.backend.repository.*;
import com.talkcs.backend.model.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userrepository;
    private final PostRepository postrepository;
    private final CommentRepository commentrepository;
    private final FollowRepository followRepository;
    private final NotificationService notificationService;

    public UserResponse getUserProfile(String username) {
        User user = userrepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));
        int rep = user.getReputation();
        String currentEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userrepository.findByEmail(currentEmail).orElse(null);
        boolean followed = currentUser != null &&
            followRepository.existsByFollowerIdAndFollowingId(currentUser.getId(), user.getId());
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
            .followerCount(followRepository.countByFollowingId(user.getId()))
            .followingCount(followRepository.countByFollowerId(user.getId()))
            .followedByCurrentUser(followed)
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

    public void followUser(String username) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User follower = userrepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        User following = userrepository.findByUsername(username).orElseThrow(() -> new RuntimeException("User not found"));
        if (follower.getId().equals(following.getId())) throw new RuntimeException("Cannot follow yourself");
        if (!followRepository.existsByFollowerIdAndFollowingId(follower.getId(), following.getId())) {
            followRepository.save(Follow.builder().follower(follower).following(following).createdAt(LocalDateTime.now()).build());
            notificationService.notify(following,
                com.talkcs.backend.model.Notification.NotificationType.FOLLOW,
                follower.getUsername() + " started following you",
                "/profile/" + follower.getUsername());
        }
    }

    public void unfollowUser(String username) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User follower = userrepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        User following = userrepository.findByUsername(username).orElseThrow(() -> new RuntimeException("User not found"));
        followRepository.findByFollowerIdAndFollowingId(follower.getId(), following.getId())
            .ifPresent(followRepository::delete);
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