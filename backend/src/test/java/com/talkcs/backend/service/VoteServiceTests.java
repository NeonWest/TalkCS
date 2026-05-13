package com.talkcs.backend.service;

import com.talkcs.backend.model.*;
import com.talkcs.backend.repository.*;
import com.talkcs.backend.testsupport.SecurityTestSupport;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VoteServiceTests {

    @Mock private VoteRepository voteRepository;
    @Mock private UserRepository userRepository;
    @Mock private PostRepository postRepository;
    @Mock private CommentRepository commentRepository;
    @Mock private ResourceRepository resourceRepository;
    @Mock private CategoryReputationRepository categoryReputationRepository;
    @Mock private BadgeService badgeService;
    @InjectMocks private VoteService voteService;

    @AfterEach
    void tearDown() { SecurityTestSupport.clear(); }

    private User user(long id, String email, int rep) {
        return User.builder().id(id).email(email).username("u" + id).reputation(rep).build();
    }
    private Category cat() { return Category.builder().id(1L).name("X").build(); }

    @Test
    void voteOnPost_blocksSelfVote() {
        SecurityTestSupport.setAuth("a@t.com");
        User u = user(1L, "a@t.com", 0);
        when(userRepository.findByEmail("a@t.com")).thenReturn(Optional.of(u));
        Post p = Post.builder().id(1L).author(u).category(cat()).build();
        when(postRepository.findById(1L)).thenReturn(Optional.of(p));

        assertThatThrownBy(() -> voteService.voteOnPost(1L, 1)).hasMessage("Cannot vote on your own post");
    }

    @Test
    void voteOnPost_newVoteAddsToAuthorRep() {
        SecurityTestSupport.setAuth("voter@t.com");
        User voter = user(2L, "voter@t.com", 0);
        User author = user(1L, "a@t.com", 10);
        Post p = Post.builder().id(1L).author(author).category(cat()).build();
        when(userRepository.findByEmail("voter@t.com")).thenReturn(Optional.of(voter));
        when(postRepository.findById(1L)).thenReturn(Optional.of(p));
        when(voteRepository.findByVoterIdAndPostId(2L, 1L)).thenReturn(Optional.empty());
        when(categoryReputationRepository.findByUserIdAndCategoryId(any(), any())).thenReturn(Optional.empty());

        voteService.voteOnPost(1L, 1);
        assertThat(author.getReputation()).isEqualTo(11);
        verify(voteRepository).save(any(Vote.class));
    }

    @Test
    void voteOnPost_togglingSameVoteRemovesIt() {
        SecurityTestSupport.setAuth("voter@t.com");
        User voter = user(2L, "voter@t.com", 0);
        User author = user(1L, "a@t.com", 11);
        Post p = Post.builder().id(1L).author(author).category(cat()).build();
        Vote existing = Vote.builder().id(50L).voter(voter).post(p).value(1).build();
        when(userRepository.findByEmail("voter@t.com")).thenReturn(Optional.of(voter));
        when(postRepository.findById(1L)).thenReturn(Optional.of(p));
        when(voteRepository.findByVoterIdAndPostId(2L, 1L)).thenReturn(Optional.of(existing));
        when(categoryReputationRepository.findByUserIdAndCategoryId(any(), any())).thenReturn(Optional.empty());

        voteService.voteOnPost(1L, 1);
        assertThat(author.getReputation()).isEqualTo(10);
        verify(voteRepository).delete(existing);
    }

    @Test
    void voteOnPost_changingVoteAdjustsByDelta() {
        SecurityTestSupport.setAuth("voter@t.com");
        User voter = user(2L, "voter@t.com", 0);
        User author = user(1L, "a@t.com", 9);
        Post p = Post.builder().id(1L).author(author).category(cat()).build();
        Vote existing = Vote.builder().id(50L).voter(voter).post(p).value(-1).build();
        when(userRepository.findByEmail("voter@t.com")).thenReturn(Optional.of(voter));
        when(postRepository.findById(1L)).thenReturn(Optional.of(p));
        when(voteRepository.findByVoterIdAndPostId(2L, 1L)).thenReturn(Optional.of(existing));
        when(categoryReputationRepository.findByUserIdAndCategoryId(any(), any())).thenReturn(Optional.empty());

        voteService.voteOnPost(1L, 1);
        assertThat(author.getReputation()).isEqualTo(11); // 9 + delta(2)
        assertThat(existing.getValue()).isEqualTo(1);
        verify(voteRepository).save(existing);
    }

    @Test
    void voteOnComment_throwsOnSelf() {
        SecurityTestSupport.setAuth("a@t.com");
        User u = user(1L, "a@t.com", 0);
        Comment c = Comment.builder().id(1L).author(u).post(Post.builder().category(cat()).build()).build();
        when(userRepository.findByEmail(any())).thenReturn(Optional.of(u));
        when(commentRepository.findById(1L)).thenReturn(Optional.of(c));

        assertThatThrownBy(() -> voteService.voteOnComment(1L, 1)).hasMessage("Cannot vote on your own comment");
    }

    @Test
    void voteOnResource_blocksSelf() {
        SecurityTestSupport.setAuth("a@t.com");
        User u = user(1L, "a@t.com", 0);
        Resource r = Resource.builder().id(1L).uploader(u).build();
        when(userRepository.findByEmail(any())).thenReturn(Optional.of(u));
        when(resourceRepository.findById(1L)).thenReturn(Optional.of(r));

        assertThatThrownBy(() -> voteService.voteOnResource(1L, 1)).hasMessage("Cannot vote on your own resource");
    }
}
