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
    List<Post> findByCategoryId(Long categoryId);

    long countByCreatedAtAfter(java.time.LocalDateTime date);

    @org.springframework.data.jpa.repository.Query(
        value = "SELECT p FROM Post p WHERE p.createdAt >= :since ORDER BY (SELECT COUNT(v) FROM Vote v WHERE v.post = p AND v.value = 1) * 2 + (SELECT COUNT(c) FROM Comment c WHERE c.post = p) DESC")
    List<Post> findTrendingPosts(@org.springframework.data.repository.query.Param("since") java.time.LocalDateTime since, org.springframework.data.domain.Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT p.category.id, p.category.name, COUNT(p) FROM Post p GROUP BY p.category.id, p.category.name ORDER BY COUNT(p) DESC")
    List<Object[]> countGroupByCategory(org.springframework.data.domain.Pageable pageable);
}