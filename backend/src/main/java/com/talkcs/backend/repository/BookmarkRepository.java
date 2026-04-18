package com.talkcs.backend.repository;

import com.talkcs.backend.model.Bookmark;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface BookmarkRepository extends JpaRepository<Bookmark, Long> {
    boolean existsByUserIdAndPostId(Long userId, Long postId);
    Optional<Bookmark> findByUserIdAndPostId(Long userId, Long postId);
    List<Bookmark> findByUserId(Long userId);
}
