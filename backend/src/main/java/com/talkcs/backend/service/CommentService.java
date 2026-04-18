package com.talkcs.backend.service;

import com.talkcs.backend.dto.*;
import com.talkcs.backend.repository.*;
import com.talkcs.backend.model.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.security.core.context.*;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.security.core.Authentication;


@Service 
@RequiredArgsConstructor
public class CommentService{
    private final PostRepository postrepository;
    private final CommentRepository commentrepository;
    private final UserRepository userrepository;
    private final VoteRepository voteRepository;
    private final BadgeService badgeService;

    public List<CommentResponse> getCommentsByPostId(Long Id){
        return commentrepository.findByPostIdAndParentIsNull(Id)
        .stream()
        .map(comment -> CommentResponse.builder()
        .id(comment.getId())
        .body(comment.getBody())
        .createdAt(comment.getCreatedAt())
        .authorUsername(comment.getAuthor().getUsername())
        .authorLevel(UserService.getLevelTitle(comment.getAuthor().getReputation()))
        .children(getChildren(comment.getId()))
        .voteScore(getCommentVoteScore(comment.getId()))
        .userVote(getCommentUserVote(comment.getId()))
        .build()).toList();
    }

    private List<CommentResponse> getChildren(Long Id){
        return commentrepository.findByParentId(Id)
        .stream()
        .map(children -> CommentResponse.builder()
        .id(children.getId())
        .body(children.getBody())
        .createdAt(children.getCreatedAt())
        .authorUsername(children.getAuthor().getUsername())
        .authorLevel(UserService.getLevelTitle(children.getAuthor().getReputation()))
        .children(getChildren(children.getId()))
        .voteScore(getCommentVoteScore(children.getId()))
        .userVote(getCommentUserVote(children.getId()))
        .build()).toList();
    }
    
    public CommentResponse createComment(CommentRequest request){
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userrepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User Not Found"));
        Post post = postrepository.findById(request.getPostId()).orElseThrow(() -> new RuntimeException("Post Not Found"));
        Comment parent = null;
        if (request.getParentId() != null) {
            parent = commentrepository.findById(request.getParentId())
            .orElseThrow(() -> new RuntimeException("Parent Not Found"));
}

        Comment saved = commentrepository.save(
            Comment.builder()
            .body(request.getBody())
            .createdAt(LocalDateTime.now())
            .author(user)
            .post(post)
            .parent(parent)
            .build()
        );

        badgeService.checkAndAwardBadges(user);

        return CommentResponse.builder()
        .id(saved.getId())
        .body(saved.getBody())
        .authorUsername(saved.getAuthor().getUsername())
        .authorLevel(UserService.getLevelTitle(saved.getAuthor().getReputation()))
        .createdAt(saved.getCreatedAt())
        .children(getChildren(saved.getId()))
        .voteScore(getCommentVoteScore(saved.getId()))
        .userVote(getCommentUserVote(saved.getId()))
        .build();

        

    }

    public CommentResponse editComment(Long id, CommentRequest request) {
    String email = SecurityContextHolder.getContext().getAuthentication().getName();
    Comment comment = commentrepository.findById(id)
        .orElseThrow(() -> new RuntimeException("Comment not found"));
    if (!comment.getAuthor().getEmail().equals(email))
        throw new RuntimeException("Unauthorized");
    comment.setBody(request.getBody());
    Comment saved = commentrepository.save(comment);
    return CommentResponse.builder()
        .id(saved.getId())
        .body(saved.getBody())
        .authorUsername(saved.getAuthor().getUsername())
        .authorLevel(UserService.getLevelTitle(saved.getAuthor().getReputation()))
        .createdAt(saved.getCreatedAt())
        .children(getChildren(saved.getId()))
        .voteScore(getCommentVoteScore(saved.getId()))
        .userVote(getCommentUserVote(saved.getId()))
        .build();
    }

    public void deleteComment(Long id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        Comment comment = commentrepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Comment not found"));
        boolean isAdmin = auth.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (!comment.getAuthor().getEmail().equals(email) && !isAdmin)
            throw new RuntimeException("Unauthorized");
        commentrepository.delete(comment);
    }

    private int getCommentVoteScore(Long commentId) {
    return voteRepository.countByCommentIdAndValue(commentId, 1) -
           voteRepository.countByCommentIdAndValue(commentId, -1);
    }

    private int getCommentUserVote(Long commentId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getName().equals("anonymousUser"))
            return 0;
        User currentUser = userrepository.findByEmail(auth.getName()).orElse(null);
        if (currentUser == null) return 0;
        return voteRepository.findByVoterIdAndCommentId(currentUser.getId(), commentId)
            .map(Vote::getValue).orElse(0);
    }
}