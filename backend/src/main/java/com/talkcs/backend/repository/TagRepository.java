package com.talkcs.backend.repository;

import com.talkcs.backend.model.Tag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface TagRepository extends JpaRepository<Tag, Long> {
    Optional<Tag> findByName(String name);
    List<Tag> findByNameContainingIgnoreCase(String name);

    @Query("SELECT t FROM Post p JOIN p.tags t GROUP BY t ORDER BY COUNT(p) DESC")
    List<Tag> findPopularTags(org.springframework.data.domain.Pageable pageable);
}
