package com.talkcs.backend.service;

import com.talkcs.backend.dto.CommentRequest;
import com.talkcs.backend.dto.CommentResponse;
import com.talkcs.backend.model.*;
import com.talkcs.backend.repository.*;
import com.talkcs.backend.testsupport.SecurityTestSupport;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CommentServiceTests {

    @Mock private PostRepository postrepository;
    @Mock private CommentRepository commentrepository;
    @Mock private UserRepository userrepository;
    @Mock private VoteRepository voteRepository;
    @Mock private BadgeService badgeService;
    @Mock private MentionService mentionService;
    @Mock private NotificationService notificationService;
    @InjectMocks private CommentService commentService;

    @AfterEach
    void tearDown() { SecurityTestSupport.clear(); }

    private User author() { return User.builder().id(1L).username("a").email("a@t.com").build(); }
    private User other() { return User.builder().id(2L).username("o").email("o@t.com").build(); }

    @Test
    void createComment_notifiesPostAuthor() {
        SecurityTestSupport.setAuth("o@t.com");
        User postAuthor = author();
        User commenter = other();
        Post post = Post.builder().id(5L).author(postAuthor).title("Q").build();

        when(userrepository.findByEmail("o@t.com")).thenReturn(Optional.of(commenter));
        when(postrepository.findById(5L)).thenReturn(Optional.of(post));
        when(mentionService.extractMentions(any())).thenReturn(List.of());
        when(commentrepository.save(any(Comment.class))).thenAnswer(inv -> {
            Comment c = inv.getArgument(0); c.setId(100L); return c;
        });
        when(commentrepository.findByParentId(100L)).thenReturn(List.of());

        CommentRequest req = new CommentRequest();
        req.setPostId(5L); req.setBody("body");
        CommentResponse res = commentService.createComment(req);

        assertThat(res.getId()).isEqualTo(100L);
        verify(notificationService).notify(eq(postAuthor), eq(Notification.NotificationType.REPLY), any(), any());
        verify(badgeService).checkAndAwardBadges(commenter);
    }

    @Test
    void createComment_doesNotNotifyOnSelfReply() {
        SecurityTestSupport.setAuth("a@t.com");
        User u = author();
        Post post = Post.builder().id(5L).author(u).title("Q").build();
        when(userrepository.findByEmail("a@t.com")).thenReturn(Optional.of(u));
        when(postrepository.findById(5L)).thenReturn(Optional.of(post));
        when(mentionService.extractMentions(any())).thenReturn(List.of());
        when(commentrepository.save(any())).thenAnswer(inv -> { Comment c = inv.getArgument(0); c.setId(1L); return c; });
        when(commentrepository.findByParentId(1L)).thenReturn(List.of());

        CommentRequest req = new CommentRequest();
        req.setPostId(5L); req.setBody("self");
        commentService.createComment(req);

        verify(notificationService, never()).notify(any(), eq(Notification.NotificationType.REPLY), any(), any());
    }

    @Test
    void createComment_throwsWhenParentMissing() {
        SecurityTestSupport.setAuth("o@t.com");
        when(userrepository.findByEmail(any())).thenReturn(Optional.of(other()));
        when(postrepository.findById(any())).thenReturn(Optional.of(Post.builder().id(5L).author(author()).build()));
        when(commentrepository.findById(99L)).thenReturn(Optional.empty());

        CommentRequest req = new CommentRequest();
        req.setPostId(5L); req.setBody("x"); req.setParentId(99L);
        assertThatThrownBy(() -> commentService.createComment(req)).hasMessage("Parent Not Found");
    }

    @Test
    void editComment_blocksNonOwner() {
        SecurityTestSupport.setAuth("o@t.com");
        Comment c = Comment.builder().id(1L).author(author()).build();
        when(commentrepository.findById(1L)).thenReturn(Optional.of(c));

        CommentRequest req = new CommentRequest();
        req.setBody("edit");
        assertThatThrownBy(() -> commentService.editComment(1L, req)).hasMessage("Unauthorized");
    }

    @Test
    void deleteComment_allowsOwner() {
        SecurityTestSupport.setAuth("a@t.com");
        Post p = Post.builder().id(5L).build();
        Comment c = Comment.builder().id(1L).author(author()).post(p).build();
        when(commentrepository.findById(1L)).thenReturn(Optional.of(c));

        Long postId = commentService.deleteComment(1L);
        assertThat(postId).isEqualTo(5L);
        verify(commentrepository).delete(c);
    }

    @Test
    void deleteComment_blocksOtherNonAdmin() {
        SecurityTestSupport.setAuth("o@t.com", "STUDENT");
        Comment c = Comment.builder().id(1L).author(author()).post(Post.builder().id(5L).build()).build();
        when(commentrepository.findById(1L)).thenReturn(Optional.of(c));

        assertThatThrownBy(() -> commentService.deleteComment(1L)).hasMessage("Unauthorized");
    }

    @Test
    void deleteComment_allowsAdmin() {
        SecurityTestSupport.setAuth("admin@t.com", "ADMIN");
        Comment c = Comment.builder().id(1L).author(author()).post(Post.builder().id(5L).build()).build();
        when(commentrepository.findById(1L)).thenReturn(Optional.of(c));

        commentService.deleteComment(1L);
        verify(commentrepository).delete(c);
    }

    @Test
    void getCommentsByPostId_paginates() {
        SecurityTestSupport.setAuth("a@t.com");
        Comment c1 = Comment.builder().id(1L).body("hi").author(author()).createdAt(java.time.LocalDateTime.now()).build();
        Page<Comment> page = new PageImpl<>(List.of(c1));
        when(commentrepository.findByPostIdAndParentIsNull(eq(5L), any())).thenReturn(page);
        when(commentrepository.findByParentId(any())).thenReturn(List.of());
        when(userrepository.findByEmail(any())).thenReturn(Optional.of(author()));

        Map<String, Object> result = commentService.getCommentsByPostId(5L, 0, 10);
        assertThat(result.get("totalItems")).isEqualTo(1L);
    }
}
