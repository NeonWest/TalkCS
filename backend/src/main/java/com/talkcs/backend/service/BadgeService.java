package com.talkcs.backend.service;

import com.talkcs.backend.model.*;
import com.talkcs.backend.model.Badge.BadgeType;
import com.talkcs.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class BadgeService {
    private final BadgeRepository badgeRepository;
    private final UserBadgeRepository userBadgeRepository;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final CategoryReputationRepository categoryReputationRepository;

    public void checkAndAwardBadges(User user) {
        int postCount = (int) postRepository.countByAuthorId(user.getId());
        int commentCount = (int) commentRepository.countByAuthorId(user.getId());
        int rep = user.getReputation();

        // Post milestones
        if (postCount >= 1)   tryAward(user, "First Post",    "Made your first post",       "post1",    BadgeType.MILESTONE);
        if (postCount >= 10)  tryAward(user, "Active Poster", "Made 10 posts",               "post10",   BadgeType.MILESTONE);
        if (postCount >= 50)  tryAward(user, "Power Poster",  "Made 50 posts",               "post50",   BadgeType.MILESTONE);
        if (postCount >= 100) tryAward(user, "Prolific",      "Made 100 posts",              "post100",  BadgeType.MILESTONE);

        // Comment milestones
        if (commentCount >= 1)   tryAward(user, "First Comment",   "Made your first comment",  "cmt1",   BadgeType.MILESTONE);
        if (commentCount >= 10)  tryAward(user, "Commentator",     "Made 10 comments",         "cmt10",  BadgeType.MILESTONE);
        if (commentCount >= 50)  tryAward(user, "Conversational",  "Made 50 comments",         "cmt50",  BadgeType.MILESTONE);
        if (commentCount >= 100) tryAward(user, "Chatterbox",      "Made 100 comments",        "cmt100", BadgeType.MILESTONE);

        // Rep milestones
        if (rep >= 50)   tryAward(user, "Rising Star",    "Reached 50 reputation",   "rep50",   BadgeType.MILESTONE);
        if (rep >= 200)  tryAward(user, "Trusted Member", "Reached 200 reputation",  "rep200",  BadgeType.MILESTONE);
        if (rep >= 500)  tryAward(user, "Community Pillar","Reached 500 reputation", "rep500",  BadgeType.MILESTONE);
        if (rep >= 1000) tryAward(user, "Expert",         "Reached 1000 reputation", "rep1000", BadgeType.MILESTONE);
    }

    public void awardAnswerAcceptedBadge(User user) {
        tryAward(user, "First Accepted Answer", "Had an answer accepted", "accepted1", BadgeType.SPECIAL);
    }

    public List<UserBadge> getUserBadges(Long userId) {
        return userBadgeRepository.findByUserId(userId);
    }

    public List<com.talkcs.backend.dto.BadgeResponse> getAllMilestoneBadgesForUser(Long userId) {
        List<UserBadge> earnedUserBadges = userBadgeRepository.findByUserId(userId);
        List<Badge> allMilestones = badgeRepository.findByType(BadgeType.MILESTONE);

        return allMilestones.stream().map(badge -> {
            var userBadge = earnedUserBadges.stream()
                .filter(ub -> ub.getBadge().getId().equals(badge.getId()))
                .findFirst();

            return com.talkcs.backend.dto.BadgeResponse.builder()
                .id(badge.getId())
                .name(badge.getName())
                .description(badge.getDescription())
                .iconKey(badge.getIconKey())
                .type(badge.getType())
                .earned(userBadge.isPresent())
                .awardedAt(userBadge.map(UserBadge::getAwardedAt).orElse(null))
                .build();
        }).toList();
    }

    public List<com.talkcs.backend.dto.BadgeResponse> getSpecialBadgesForUser(Long userId) {
        return userBadgeRepository.findByUserId(userId).stream()
            .filter(ub -> ub.getBadge().getType() == BadgeType.SPECIAL)
            .map(ub -> com.talkcs.backend.dto.BadgeResponse.builder()
                .id(ub.getBadge().getId())
                .name(ub.getBadge().getName())
                .description(ub.getBadge().getDescription())
                .iconKey(ub.getBadge().getIconKey())
                .type(ub.getBadge().getType())
                .earned(true)
                .awardedAt(ub.getAwardedAt())
                .build())
            .toList();
    }

    public void checkExpertiseBadges(User user, Category category) {
        int rep = categoryReputationRepository
            .findByUserIdAndCategoryId(user.getId(), category.getId())
            .map(CategoryReputation::getReputation).orElse(0);
        String cat = category.getName();
        if (rep >= 500) tryAward(user, cat + " Expert (Gold)",   cat + " gold expertise",   "exp_gold_"   + category.getId(), BadgeType.SPECIAL);
        if (rep >= 200) tryAward(user, cat + " Expert (Silver)", cat + " silver expertise", "exp_silver_" + category.getId(), BadgeType.SPECIAL);
        if (rep >= 50)  tryAward(user, cat + " Expert (Bronze)", cat + " bronze expertise", "exp_bronze_" + category.getId(), BadgeType.SPECIAL);
    }

    private void tryAward(User user, String badgeName, String description, String iconKey, BadgeType type) {
        Badge badge = badgeRepository.findByName(badgeName).orElseGet(() ->
            badgeRepository.save(Badge.builder()
                .name(badgeName).description(description).iconKey(iconKey).type(type).build()));
        if (!userBadgeRepository.existsByUserIdAndBadgeId(user.getId(), badge.getId())) {
            userBadgeRepository.save(UserBadge.builder()
                .user(user).badge(badge).awardedAt(LocalDateTime.now()).build());
        }
    }
}
