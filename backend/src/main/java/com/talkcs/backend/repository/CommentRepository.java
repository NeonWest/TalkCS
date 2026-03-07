package com.talkcs.backend.repository;

import com.talkcs.backend.model.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CommentRepository extends JpaRepository<Comment,Long> {
    List<Comment> findByPostIdAndParentIsNull(Long postId);
    List<Comment> findByParentId(Long parentId);
    int countByPostId(Long postId);
}