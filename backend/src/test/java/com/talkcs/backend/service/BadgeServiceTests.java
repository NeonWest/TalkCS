package com.talkcs.backend.service;

import com.talkcs.backend.dto.BadgeResponse;
import com.talkcs.backend.model.Badge;
import com.talkcs.backend.model.Badge.BadgeType;
import com.talkcs.backend.model.Category;
import com.talkcs.backend.model.CategoryReputation;
import com.talkcs.backend.model.User;
import com.talkcs.backend.model.UserBadge;
import com.talkcs.backend.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BadgeServiceTests {

    @Mock private BadgeRepository badgeRepository;
    @Mock private UserBadgeRepository userBadgeRepository;
    @Mock private PostRepository postRepository;
    @Mock private CommentRepository commentRepository;
    @Mock private CategoryReputationRepository categoryReputationRepository;
    @InjectMocks private BadgeService badgeService;

    @Test
    void checkAndAwardBadges_awardsFirstPostWhenEligible() {
        User u = User.builder().id(1L).username("u").reputation(0).build();
        when(postRepository.countByAuthorId(1L)).thenReturn(1L);
        when(commentRepository.countByAuthorId(1L)).thenReturn(0L);
        when(badgeRepository.findByName(anyString())).thenReturn(Optional.empty());
        when(badgeRepository.save(any(Badge.class))).thenAnswer(inv -> { Badge b = inv.getArgument(0); b.setId(1L); return b; });
        when(userBadgeRepository.existsByUserIdAndBadgeId(any(), any())).thenReturn(false);

        badgeService.checkAndAwardBadges(u);

        verify(userBadgeRepository, atLeastOnce()).save(any(UserBadge.class));
    }

    @Test
    void checkAndAwardBadges_doesNotAwardWhenBelowThreshold() {
        User u = User.builder().id(1L).reputation(0).build();
        when(postRepository.countByAuthorId(1L)).thenReturn(0L);
        when(commentRepository.countByAuthorId(1L)).thenReturn(0L);

        badgeService.checkAndAwardBadges(u);
        verify(userBadgeRepository, never()).save(any());
    }

    @Test
    void checkAndAwardBadges_skipsIfAlreadyAwarded() {
        User u = User.builder().id(1L).reputation(0).build();
        when(postRepository.countByAuthorId(1L)).thenReturn(1L);
        when(commentRepository.countByAuthorId(1L)).thenReturn(0L);
        Badge b = Badge.builder().id(7L).name("First Post").type(BadgeType.MILESTONE).build();
        when(badgeRepository.findByName("First Post")).thenReturn(Optional.of(b));
        when(userBadgeRepository.existsByUserIdAndBadgeId(1L, 7L)).thenReturn(true);

        badgeService.checkAndAwardBadges(u);
        verify(userBadgeRepository, never()).save(any());
    }

    @Test
    void awardAnswerAcceptedBadge_createsAndPersists() {
        User u = User.builder().id(1L).build();
        when(badgeRepository.findByName("First Accepted Answer")).thenReturn(Optional.empty());
        when(badgeRepository.save(any())).thenAnswer(inv -> { Badge b = inv.getArgument(0); b.setId(1L); return b; });
        when(userBadgeRepository.existsByUserIdAndBadgeId(any(), any())).thenReturn(false);

        badgeService.awardAnswerAcceptedBadge(u);
        verify(userBadgeRepository).save(any(UserBadge.class));
    }

    @Test
    void getAllMilestoneBadgesForUser_marksEarned() {
        Badge b1 = Badge.builder().id(1L).name("First Post").type(BadgeType.MILESTONE).build();
        Badge b2 = Badge.builder().id(2L).name("Active Poster").type(BadgeType.MILESTONE).build();
        UserBadge earned = UserBadge.builder().badge(b1).awardedAt(java.time.LocalDateTime.now()).build();
        when(badgeRepository.findByType(BadgeType.MILESTONE)).thenReturn(List.of(b1, b2));
        when(userBadgeRepository.findByUserId(1L)).thenReturn(List.of(earned));

        List<BadgeResponse> out = badgeService.getAllMilestoneBadgesForUser(1L);
        assertThat(out).hasSize(2);
        assertThat(out.stream().filter(BadgeResponse::isEarned).count()).isEqualTo(1L);
    }

    @Test
    void checkExpertiseBadges_awardsBronzeAtFifty() {
        User u = User.builder().id(1L).build();
        Category c = Category.builder().id(1L).name("Java").build();
        when(categoryReputationRepository.findByUserIdAndCategoryId(1L, 1L))
            .thenReturn(Optional.of(CategoryReputation.builder().reputation(50).build()));
        when(badgeRepository.findByName(anyString())).thenReturn(Optional.empty());
        when(badgeRepository.save(any())).thenAnswer(inv -> { Badge b = inv.getArgument(0); b.setId(1L); return b; });
        when(userBadgeRepository.existsByUserIdAndBadgeId(any(), any())).thenReturn(false);

        badgeService.checkExpertiseBadges(u, c);
        verify(userBadgeRepository, atLeastOnce()).save(any(UserBadge.class));
    }
}
