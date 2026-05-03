package com.talkcs.backend.repository;

import com.talkcs.backend.model.Badge;
import com.talkcs.backend.model.Badge.BadgeType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface BadgeRepository extends JpaRepository<Badge, Long> {
    Optional<Badge> findByName(String name);
    List<Badge> findByType(BadgeType type);
}
