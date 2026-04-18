package com.talkcs.backend.service;

import com.talkcs.backend.model.*;
import com.talkcs.backend.model.Badge.BadgeType;
import com.talkcs.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BadgeService {
    private final BadgeRepository badgeRepository;
    private final UserBadgeRepository userBadgeRepository;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;

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
