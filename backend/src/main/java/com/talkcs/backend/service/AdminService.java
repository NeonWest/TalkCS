package com.talkcs.backend.service;

import com.talkcs.backend.dto.AdminStatsResponse;
import com.talkcs.backend.dto.UserAdminResponse;
import com.talkcs.backend.model.SiteConfig;
import com.talkcs.backend.model.User;
import com.talkcs.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminService {
    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final ResourceRepository resourceRepository;
    private final SiteConfigRepository siteConfigRepository;

    public AdminStatsResponse getStats() {
        LocalDateTime weekAgo = LocalDateTime.now().minusDays(7);
        List<Object[]> raw = postRepository.countGroupByCategory(PageRequest.of(0, 5));
        List<AdminStatsResponse.CategoryStat> topCategories = raw.stream()
            .map(r -> AdminStatsResponse.CategoryStat.builder()
                .categoryId((Long) r[0])
                .categoryName((String) r[1])
                .postCount((long) r[2])
                .build())
            .toList();

        return AdminStatsResponse.builder()
            .totalUsers(userRepository.count())
            .totalPosts(postRepository.count())
            .totalComments(commentRepository.count())
            .totalResources(resourceRepository.count())
            .postsThisWeek(postRepository.countByCreatedAtAfter(weekAgo))
            .newUsersThisWeek(userRepository.countByCreatedAtAfter(weekAgo))
            .mostActiveCategories(topCategories)
            .build();
    }

    public Map<String, Object> getUsers(int page, String search) {
        PageRequest pr = PageRequest.of(page, 20, Sort.by("createdAt").descending());
        Page<User> users = (search != null && !search.isBlank())
            ? userRepository.findByUsernameContainingIgnoreCase(search, pr)
            : userRepository.findAll(pr);

        List<UserAdminResponse> content = users.getContent().stream()
            .map(u -> UserAdminResponse.builder()
                .id(u.getId())
                .username(u.getUsername())
                .email(u.getEmail())
                .role(u.getRole())
                .reputation(u.getReputation())
                .createdAt(u.getCreatedAt())
                .postCount(postRepository.countByAuthorId(u.getId()))
                .commentCount(commentRepository.countByAuthorId(u.getId()))
                .build())
            .toList();

        return Map.of(
            "content", content,
            "totalPages", users.getTotalPages(),
            "totalElements", users.getTotalElements(),
            "page", page
        );
    }

    @Transactional
    public UserAdminResponse setRole(Long userId, String role) {
        if (!List.of("STUDENT", "PROFESSOR", "ADMIN").contains(role))
            throw new RuntimeException("Invalid role: " + role);
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        user.setRole(role);
        userRepository.save(user);
        return UserAdminResponse.builder()
            .id(user.getId())
            .username(user.getUsername())
            .email(user.getEmail())
            .role(user.getRole())
            .reputation(user.getReputation())
            .createdAt(user.getCreatedAt())
            .postCount(postRepository.countByAuthorId(user.getId()))
            .commentCount(commentRepository.countByAuthorId(user.getId()))
            .build();
    }

    @Transactional
    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        user.setUsername("deleted_user_" + userId);
        user.setEmail("deleted_" + userId + "@deleted.invalid");
        user.setPassword("");
        user.setBio(null);
        user.setAvatarUrl(null);
        user.setRole("STUDENT");
        userRepository.save(user);
    }

    public SiteConfig getConfig() {
        return siteConfigRepository.findById(1L).orElseGet(() -> {
            SiteConfig cfg = SiteConfig.builder().id(1L).build();
            return siteConfigRepository.save(cfg);
        });
    }

    @Transactional
    public SiteConfig updateConfig(SiteConfig request) {
        SiteConfig cfg = getConfig();
        if (request.getSiteName() != null) cfg.setSiteName(request.getSiteName());
        if (request.getSiteTagline() != null) cfg.setSiteTagline(request.getSiteTagline());
        if (request.getPrimaryColor() != null) cfg.setPrimaryColor(request.getPrimaryColor());
        if (request.getLogoUrl() != null) cfg.setLogoUrl(request.getLogoUrl());
        return siteConfigRepository.save(cfg);
    }
}
