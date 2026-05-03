package com.talkcs.backend.config;

import com.talkcs.backend.model.Badge;
import com.talkcs.backend.model.Badge.BadgeType;
import com.talkcs.backend.repository.BadgeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class BadgeInitializer implements CommandLineRunner {

    private final BadgeRepository badgeRepository;

    @Override
    public void run(String... args) {
        initializeMilestoneBadges();
    }

    private void initializeMilestoneBadges() {
        List<Badge> milestones = List.of(
            // Post milestones
            createBadge("First Post",    "Made your first post",       "post1",    BadgeType.MILESTONE),
            createBadge("Active Poster", "Made 10 posts",               "post10",   BadgeType.MILESTONE),
            createBadge("Power Poster",  "Made 50 posts",               "post50",   BadgeType.MILESTONE),
            createBadge("Prolific",      "Made 100 posts",              "post100",  BadgeType.MILESTONE),

            // Comment milestones
            createBadge("First Comment",   "Made your first comment",  "cmt1",   BadgeType.MILESTONE),
            createBadge("Commentator",     "Made 10 comments",         "cmt10",  BadgeType.MILESTONE),
            createBadge("Conversational",  "Made 50 comments",         "cmt50",  BadgeType.MILESTONE),
            createBadge("Chatterbox",      "Made 100 comments",        "cmt100", BadgeType.MILESTONE),

            // Rep milestones
            createBadge("Rising Star",    "Reached 50 reputation",   "rep50",   BadgeType.MILESTONE),
            createBadge("Trusted Member", "Reached 200 reputation",  "rep200",  BadgeType.MILESTONE),
            createBadge("Community Pillar","Reached 500 reputation", "rep500",  BadgeType.MILESTONE),
            createBadge("Expert",         "Reached 1000 reputation", "rep1000", BadgeType.MILESTONE)
        );

        milestones.forEach(badge -> {
            if (badgeRepository.findByName(badge.getName()).isEmpty()) {
                badgeRepository.save(badge);
            }
        });
    }

    private Badge createBadge(String name, String description, String iconKey, BadgeType type) {
        return Badge.builder()
                .name(name)
                .description(description)
                .iconKey(iconKey)
                .type(type)
                .build();
    }
}
