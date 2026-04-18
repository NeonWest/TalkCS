package com.talkcs.backend.service;
import com.talkcs.backend.model.*;
import com.talkcs.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class VoteService {
    private final VoteRepository voteRepository;
    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final ResourceRepository resourceRepository;
    private final CategoryReputationRepository categoryReputationRepository;
    private final BadgeService badgeService;

    public void voteOnPost(Long postId, int value) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User voter = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        Post post = postRepository.findById(postId).orElseThrow(() -> new RuntimeException("Post not found"));

        if (post.getAuthor().getId().equals(voter.getId()))
            throw new RuntimeException("Cannot vote on your own post");

        User author = post.getAuthor();
        voteRepository.findByVoterIdAndPostId(voter.getId(), postId).ifPresentOrElse(
            existing -> {
                if (existing.getValue() == value) {
                    author.setReputation(author.getReputation() - value);
                    userRepository.save(author);
                    adjustCategoryRep(author, post.getCategory(), -value);
                    voteRepository.delete(existing);
                } else {
                    int delta = value - existing.getValue();
                    author.setReputation(author.getReputation() + delta);
                    userRepository.save(author);
                    adjustCategoryRep(author, post.getCategory(), delta);
                    existing.setValue(value);
                    voteRepository.save(existing);
                }
            },
            () -> {
                author.setReputation(author.getReputation() + value);
                userRepository.save(author);
                adjustCategoryRep(author, post.getCategory(), value);
                voteRepository.save(Vote.builder()
                    .voter(voter).post(post).value(value)
                    .createdAt(LocalDateTime.now()).build());
            }
        );
        badgeService.checkExpertiseBadges(author, post.getCategory());
    }

    public void voteOnComment(Long commentId, int value) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User voter = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        Comment comment = commentRepository.findById(commentId).orElseThrow(() -> new RuntimeException("Comment not found"));

        if (comment.getAuthor().getId().equals(voter.getId()))
            throw new RuntimeException("Cannot vote on your own comment");

        User author = comment.getAuthor();
        Category category = comment.getPost().getCategory();
        voteRepository.findByVoterIdAndCommentId(voter.getId(), commentId).ifPresentOrElse(
            existing -> {
                if (existing.getValue() == value) {
                    author.setReputation(author.getReputation() - value);
                    userRepository.save(author);
                    adjustCategoryRep(author, category, -value);
                    voteRepository.delete(existing);
                } else {
                    int delta = value - existing.getValue();
                    author.setReputation(author.getReputation() + delta);
                    userRepository.save(author);
                    adjustCategoryRep(author, category, delta);
                    existing.setValue(value);
                    voteRepository.save(existing);
                }
            },
            () -> {
                author.setReputation(author.getReputation() + value);
                userRepository.save(author);
                adjustCategoryRep(author, category, value);
                voteRepository.save(Vote.builder()
                    .voter(voter).comment(comment).value(value)
                    .createdAt(LocalDateTime.now()).build());
            }
        );
        badgeService.checkExpertiseBadges(author, category);
    }

    private void adjustCategoryRep(User user, Category category, int delta) {
        CategoryReputation cr = categoryReputationRepository
            .findByUserIdAndCategoryId(user.getId(), category.getId())
            .orElseGet(() -> CategoryReputation.builder().user(user).category(category).build());
        cr.setReputation(cr.getReputation() + delta);
        categoryReputationRepository.save(cr);
    }

    public void voteOnResource(Long resourceId, int value) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User voter = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        Resource resource = resourceRepository.findById(resourceId).orElseThrow(() -> new RuntimeException("Resource not found"));

        if (resource.getUploader().getId().equals(voter.getId())) {
            throw new RuntimeException("Cannot vote on your own resource");
        }

        User author = resource.getUploader();
        voteRepository.findByVoterIdAndResourceId(voter.getId(), resourceId).ifPresentOrElse(
            existing -> {
                if (existing.getValue() == value) {
                    author.setReputation(author.getReputation() - value);
                    userRepository.save(author);
                    voteRepository.delete(existing);
                } else {
                    author.setReputation(author.getReputation() - existing.getValue() + value);
                    userRepository.save(author);
                    existing.setValue(value);
                    voteRepository.save(existing);
                }
            },
            () -> {
                author.setReputation(author.getReputation() + value);
                userRepository.save(author);
                voteRepository.save(Vote.builder()
                    .voter(voter).resource(resource).value(value)
                    .createdAt(LocalDateTime.now()).build());
            }
        );
    }
}