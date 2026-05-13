package com.talkcs.backend.service;

import com.talkcs.backend.dto.UserResponse;
import com.talkcs.backend.model.Follow;
import com.talkcs.backend.model.User;
import com.talkcs.backend.repository.*;
import com.talkcs.backend.testsupport.SecurityTestSupport;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTests {

    @Mock private UserRepository userrepository;
    @Mock private PostRepository postrepository;
    @Mock private CommentRepository commentrepository;
    @Mock private FollowRepository followRepository;
    @Mock private NotificationService notificationService;
    @InjectMocks private UserService userService;

    @AfterEach
    void tearDown() { SecurityTestSupport.clear(); }

    @Test
    void levelTable_isCorrect() {
        assertThat(UserService.getLevelNumber(0)).isEqualTo(1);
        assertThat(UserService.getLevelNumber(49)).isEqualTo(1);
        assertThat(UserService.getLevelNumber(50)).isEqualTo(2);
        assertThat(UserService.getLevelNumber(200)).isEqualTo(3);
        assertThat(UserService.getLevelNumber(500)).isEqualTo(4);
        assertThat(UserService.getLevelNumber(1000)).isEqualTo(5);
        assertThat(UserService.getLevelTitle(0)).isEqualTo("Newcomer");
        assertThat(UserService.getLevelTitle(50)).isEqualTo("Contributor");
        assertThat(UserService.getLevelTitle(200)).isEqualTo("Regular");
        assertThat(UserService.getLevelTitle(500)).isEqualTo("Trusted");
        assertThat(UserService.getLevelTitle(1000)).isEqualTo("Expert");
        assertThat(UserService.getNextLevelTitle(1000)).isNull();
        assertThat(UserService.getNextLevelRep(1000)).isNull();
        assertThat(UserService.getNextLevelRep(0)).isEqualTo(50);
    }

    @Test
    void getUserProfile_includesFollowState() {
        SecurityTestSupport.setAuth("me@t.com");
        User target = User.builder().id(1L).username("t").reputation(250).build();
        User me = User.builder().id(2L).username("me").email("me@t.com").build();
        when(userrepository.findByUsername("t")).thenReturn(Optional.of(target));
        when(userrepository.findByEmail("me@t.com")).thenReturn(Optional.of(me));
        when(followRepository.existsByFollowerIdAndFollowingId(2L, 1L)).thenReturn(true);
        when(postrepository.countByAuthorId(1L)).thenReturn(5L);
        when(commentrepository.countByAuthorId(1L)).thenReturn(10L);

        UserResponse r = userService.getUserProfile("t");
        assertThat(r.getReputation()).isEqualTo(250);
        assertThat(r.getLevel()).isEqualTo(3);
        assertThat(r.isFollowedByCurrentUser()).isTrue();
    }

    @Test
    void getUserProfile_throwsWhenMissing() {
        SecurityTestSupport.setAuth("me@t.com");
        when(userrepository.findByUsername(any())).thenReturn(Optional.empty());
        assertThatThrownBy(() -> userService.getUserProfile("ghost"))
            .hasMessage("User not found");
    }

    @Test
    void followUser_savesAndNotifies() {
        SecurityTestSupport.setAuth("me@t.com");
        User me = User.builder().id(1L).username("me").email("me@t.com").build();
        User other = User.builder().id(2L).username("other").build();
        when(userrepository.findByEmail("me@t.com")).thenReturn(Optional.of(me));
        when(userrepository.findByUsername("other")).thenReturn(Optional.of(other));
        when(followRepository.existsByFollowerIdAndFollowingId(1L, 2L)).thenReturn(false);

        userService.followUser("other");
        verify(followRepository).save(any(Follow.class));
        verify(notificationService).notify(eq(other), any(), any(), any());
    }

    @Test
    void followUser_blocksSelfFollow() {
        SecurityTestSupport.setAuth("me@t.com");
        User me = User.builder().id(1L).username("me").email("me@t.com").build();
        when(userrepository.findByEmail("me@t.com")).thenReturn(Optional.of(me));
        when(userrepository.findByUsername("me")).thenReturn(Optional.of(me));

        assertThatThrownBy(() -> userService.followUser("me"))
            .hasMessage("Cannot follow yourself");
    }

    @Test
    void followUser_idempotent() {
        SecurityTestSupport.setAuth("me@t.com");
        User me = User.builder().id(1L).username("me").email("me@t.com").build();
        User other = User.builder().id(2L).username("other").build();
        when(userrepository.findByEmail("me@t.com")).thenReturn(Optional.of(me));
        when(userrepository.findByUsername("other")).thenReturn(Optional.of(other));
        when(followRepository.existsByFollowerIdAndFollowingId(1L, 2L)).thenReturn(true);

        userService.followUser("other");
        verify(followRepository, never()).save(any());
    }

    @Test
    void unfollowUser_deletesWhenExists() {
        SecurityTestSupport.setAuth("me@t.com");
        User me = User.builder().id(1L).email("me@t.com").build();
        User other = User.builder().id(2L).username("other").build();
        Follow f = Follow.builder().follower(me).following(other).build();
        when(userrepository.findByEmail("me@t.com")).thenReturn(Optional.of(me));
        when(userrepository.findByUsername("other")).thenReturn(Optional.of(other));
        when(followRepository.findByFollowerIdAndFollowingId(1L, 2L)).thenReturn(Optional.of(f));

        userService.unfollowUser("other");
        verify(followRepository).delete(f);
    }

    @Test
    void getLeaderboard_returnsRankedUsers() {
        when(userrepository.findTop20ByOrderByReputationDesc()).thenReturn(List.of(
            User.builder().id(1L).username("a").reputation(1000).build(),
            User.builder().id(2L).username("b").reputation(500).build()
        ));
        List<UserResponse> board = userService.getLeaderboard();
        assertThat(board).hasSize(2);
        assertThat(board.get(0).getLevelTitle()).isEqualTo("Expert");
    }
}
