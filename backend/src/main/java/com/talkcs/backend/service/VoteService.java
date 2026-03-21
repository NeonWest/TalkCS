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
                    .voter(voter).post(post).value(value)
                    .createdAt(LocalDateTime.now()).build());
            }
        );
    }

    public void voteOnComment(Long commentId, int value) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User voter = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        Comment comment = commentRepository.findById(commentId).orElseThrow(() -> new RuntimeException("Comment not found"));

        if (comment.getAuthor().getId().equals(voter.getId()))
            throw new RuntimeException("Cannot vote on your own comment");

        User author = comment.getAuthor();
        voteRepository.findByVoterIdAndCommentId(voter.getId(), commentId).ifPresentOrElse(
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
                    .voter(voter).comment(comment).value(value)
                    .createdAt(LocalDateTime.now()).build());
            }
        );
    }
}