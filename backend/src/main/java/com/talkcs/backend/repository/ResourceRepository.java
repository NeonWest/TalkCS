package com.talkcs.backend.repository;

import com.talkcs.backend.model.Resource;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ResourceRepository extends JpaRepository<Resource, Long> {
    List<Resource> findByCategoryId(Long categoryId);

    @Query("SELECT r FROM Resource r JOIN FETCH r.category WHERE r.createdAt >= :since ORDER BY (SELECT COUNT(v) FROM Vote v WHERE v.resource = r AND v.value = 1) DESC, r.createdAt DESC")
    List<Resource> findTopResources(@Param("since") LocalDateTime since, Pageable pageable);
}
