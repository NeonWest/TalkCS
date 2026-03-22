package com.talkcs.backend.repository;

import com.talkcs.backend.model.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PostRepository extends JpaRepository<Post,Long> {
    Page<Post> findByCategoryId(Long categoryId, Pageable pageable);
    long countByAuthorId(Long authorId);
    List<Post> findByAuthorId(Long authorId);
    List<Post> findByTitleContainingIgnoreCaseOrBodyContainingIgnoreCase(String title, String body);
}