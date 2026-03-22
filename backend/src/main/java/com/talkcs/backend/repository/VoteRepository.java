package com.talkcs.backend.repository;
import com.talkcs.backend.model.Vote;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface VoteRepository extends JpaRepository<Vote, Long> {
    Optional<Vote> findByVoterIdAndPostId(Long voterId, Long postId);
    Optional<Vote> findByVoterIdAndCommentId(Long voterId, Long commentId);
    Optional<Vote> findByVoterIdAndResourceId(Long voterId, Long resourceId);
    int countByPostIdAndValue(Long postId, int value);
    int countByCommentIdAndValue(Long commentId, int value);
    int countByResourceIdAndValue(Long resourceId, int value);
}