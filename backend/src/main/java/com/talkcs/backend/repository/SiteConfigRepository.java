package com.talkcs.backend.repository;

import com.talkcs.backend.model.SiteConfig;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SiteConfigRepository extends JpaRepository<SiteConfig, Long> {
}
