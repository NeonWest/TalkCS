package com.talkcs.backend.repository;

import com.talkcs.backend.model.CategoryReputation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CategoryReputationRepository extends JpaRepository<CategoryReputation, Long> {
    Optional<CategoryReputation> findByUserIdAndCategoryId(Long userId, Long categoryId);
    List<CategoryReputation> findByUserId(Long userId);
}
