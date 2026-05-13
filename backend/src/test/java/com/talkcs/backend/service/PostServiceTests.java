package com.talkcs.backend.service;

import com.talkcs.backend.dto.PostRequest;
import com.talkcs.backend.dto.PostResponse;
import com.talkcs.backend.model.*;
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
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PostServiceTests {

    @Mock private PostRepository postRepository;
    @Mock private CommentRepository commentRepository;
    @Mock private UserRepository userRepository;
    @Mock private CategoryRepository categoryRepository;
    @Mock private VoteRepository voteRepository;
    @Mock private TagService tagService;
    @Mock private BadgeService badgeService;
    @Mock private CategoryReputationRepository categoryReputationRepository;
    @Mock private BookmarkRepository bookmarkRepository;
    @Mock private MentionService mentionService;
    @Mock private NotificationService notificationService;
    @InjectMocks private PostService postService;

    @AfterEach
    void tearDown() { SecurityTestSupport.clear(); }

    private User author() {
        return User.builder().id(1L).username("author").email("author@t.com").reputation(10).build();
    }
    private Category cat() { return Category.builder().id(1L).name("General").build(); }

    @Test
    void createPost_persistsAndReturnsResponse() {
        SecurityTestSupport.setAuth("author@t.com");
        User u = author();
        Category c = cat();
        PostRequest req = new PostRequest();
        req.setTitle("T"); req.setBody("B"); req.setCategoryId(1L); req.setTags(List.of());

        when(userRepository.findByEmail("author@t.com")).thenReturn(Optional.of(u));
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(c));
        when(mentionService.extractMentions(any())).thenReturn(List.of());
        when(postRepository.save(any(Post.class))).thenAnswer(inv -> {
            Post p = inv.getArgument(0);
            p.setId(10L);
            return p;
        });

        PostResponse res = postService.createPost(req);

        assertThat(res.getId()).isEqualTo(10L);
        assertThat(res.getTitle()).isEqualTo("T");
        verify(badgeService).checkAndAwardBadges(u);
    }

    @Test
    void createPost_throwsWhenCategoryMissing() {
        SecurityTestSupport.setAuth("author@t.com");
        when(userRepository.findByEmail(any())).thenReturn(Optional.of(author()));
        when(categoryRepository.findById(99L)).thenReturn(Optional.empty());
        PostRequest req = new PostRequest();
        req.setCategoryId(99L);

        assertThatThrownBy(() -> postService.createPost(req))
            .hasMessage("Category Not Found");
    }

    @Test
    void editPost_throwsForNonOwner() {
        SecurityTestSupport.setAuth("other@t.com");
        Post p = Post.builder().id(1L).author(author()).category(cat()).status(PostStatus.OPEN).build();
        when(postRepository.findById(1L)).thenReturn(Optional.of(p));

        PostRequest req = new PostRequest();
        req.setTitle("x"); req.setBody("y");
        assertThatThrownBy(() -> postService.editPost(1L, req)).hasMessage("Unauthorized");
    }

    @Test
    void editPost_allowsOwner() {
        SecurityTestSupport.setAuth("author@t.com");
        Post p = Post.builder().id(1L).author(author()).category(cat()).status(PostStatus.OPEN).build();
        when(postRepository.findById(1L)).thenReturn(Optional.of(p));
        when(postRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        PostRequest req = new PostRequest();
        req.setTitle("New title"); req.setBody("New body"); req.setTags(List.of());

        PostResponse res = postService.editPost(1L, req);
        assertThat(res.getTitle()).isEqualTo("New title");
    }

    @Test
    void deletePost_allowsAdmin() {
        SecurityTestSupport.setAuth("admin@t.com", "ADMIN");
        Post p = Post.builder().id(1L).author(author()).category(cat()).build();
        when(postRepository.findById(1L)).thenReturn(Optional.of(p));

        postService.deletePost(1L);
        verify(postRepository).delete(p);
    }

    @Test
    void deletePost_throwsForOtherUser() {
        SecurityTestSupport.setAuth("other@t.com", "STUDENT");
        Post p = Post.builder().id(1L).author(author()).category(cat()).build();
        when(postRepository.findById(1L)).thenReturn(Optional.of(p));

        assertThatThrownBy(() -> postService.deletePost(1L)).hasMessage("Unauthorized");
    }

    @Test
    void acceptAnswer_updatesRepAndNotifies() {
        SecurityTestSupport.setAuth("author@t.com");
        User commenter = User.builder().id(2L).username("c").email("c@t.com").reputation(20).build();
        Post p = Post.builder().id(1L).author(author()).category(cat()).status(PostStatus.OPEN).build();
        Comment c = Comment.builder().id(5L).author(commenter).post(p).build();
        when(postRepository.findById(1L)).thenReturn(Optional.of(p));
        when(commentRepository.findById(5L)).thenReturn(Optional.of(c));
        when(categoryReputationRepository.findByUserIdAndCategoryId(any(), any())).thenReturn(Optional.empty());

        postService.acceptAnswer(1L, 5L);

        assertThat(p.getStatus()).isEqualTo(PostStatus.SOLVED);
        assertThat(p.getAcceptedAnswer()).isEqualTo(c);
        assertThat(commenter.getReputation()).isEqualTo(35);
        verify(notificationService).notify(eq(commenter), eq(Notification.NotificationType.ACCEPTED_ANSWER), anyString(), anyString());
        verify(badgeService).awardAnswerAcceptedBadge(commenter);
    }

    @Test
    void acceptAnswer_blocksNonAuthor() {
        SecurityTestSupport.setAuth("intruder@t.com");
        Post p = Post.builder().id(1L).author(author()).category(cat()).build();
        when(postRepository.findById(1L)).thenReturn(Optional.of(p));

        assertThatThrownBy(() -> postService.acceptAnswer(1L, 5L))
            .hasMessage("Only post author can accept answers");
    }

    @Test
    void unacceptAnswer_clearsAndDecrementsRep() {
        SecurityTestSupport.setAuth("author@t.com");
        User commenter = User.builder().id(2L).username("c").reputation(20).build();
        Comment c = Comment.builder().id(5L).author(commenter).build();
        User auth = author();
        auth.setReputation(10);
        Post p = Post.builder().id(1L).author(auth).category(cat()).status(PostStatus.SOLVED).acceptedAnswer(c).build();
        c.setPost(p);
        when(postRepository.findById(1L)).thenReturn(Optional.of(p));

        postService.unacceptAnswer(1L);

        assertThat(p.getStatus()).isEqualTo(PostStatus.OPEN);
        assertThat(p.getAcceptedAnswer()).isNull();
        assertThat(commenter.getReputation()).isEqualTo(5);
        assertThat(auth.getReputation()).isEqualTo(8);
    }

    @Test
    void unacceptAnswer_noopWhenNotAccepted() {
        SecurityTestSupport.setAuth("author@t.com");
        Post p = Post.builder().id(1L).author(author()).category(cat()).status(PostStatus.OPEN).build();
        when(postRepository.findById(1L)).thenReturn(Optional.of(p));

        postService.unacceptAnswer(1L);
        verify(postRepository, never()).save(any());
    }

    @Test
    void setStatus_changesStatusForOwner() {
        SecurityTestSupport.setAuth("author@t.com");
        Post p = Post.builder().id(1L).author(author()).category(cat()).status(PostStatus.OPEN).build();
        when(postRepository.findById(1L)).thenReturn(Optional.of(p));
        when(postRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        postService.setStatus(1L, "closed");
        assertThat(p.getStatus()).isEqualTo(PostStatus.CLOSED);
    }

    @Test
    void bookmarkPost_savesWhenAbsent() {
        SecurityTestSupport.setAuth("author@t.com");
        User u = author();
        Post p = Post.builder().id(1L).author(u).category(cat()).build();
        when(userRepository.findByEmail(any())).thenReturn(Optional.of(u));
        when(postRepository.findById(1L)).thenReturn(Optional.of(p));
        when(bookmarkRepository.existsByUserIdAndPostId(1L, 1L)).thenReturn(false);

        postService.bookmarkPost(1L);
        verify(bookmarkRepository).save(any(Bookmark.class));
    }

    @Test
    void bookmarkPost_idempotent() {
        SecurityTestSupport.setAuth("author@t.com");
        User u = author();
        Post p = Post.builder().id(1L).author(u).category(cat()).build();
        when(userRepository.findByEmail(any())).thenReturn(Optional.of(u));
        when(postRepository.findById(1L)).thenReturn(Optional.of(p));
        when(bookmarkRepository.existsByUserIdAndPostId(1L, 1L)).thenReturn(true);

        postService.bookmarkPost(1L);
        verify(bookmarkRepository, never()).save(any());
    }
}
