package com.talkcs.backend.service;

import com.talkcs.backend.model.Tag;
import com.talkcs.backend.repository.TagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TagService {
    private final TagRepository tagRepository;

    public Tag getOrCreateTag(String name) {
        String normalized = name.trim().toLowerCase();
        return tagRepository.findByName(normalized)
            .orElseGet(() -> tagRepository.save(Tag.builder().name(normalized).build()));
    }

    public List<Tag> getPopularTags() {
        return tagRepository.findPopularTags(PageRequest.of(0, 20));
    }

    public List<Tag> getAllTags() {
        return tagRepository.findAll();
    }
}
