package com.talkcs.backend.repository;

import com.talkcs.backend.model.Resource;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ResourceRepository extends JpaRepository<Resource, Long> {
    List<Resource> findByCategoryId(Long categoryId);
}
