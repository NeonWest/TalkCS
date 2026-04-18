package com.talkcs.backend.service;

import com.talkcs.backend.repository.TagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class TagSuggestionService {
    private final TagRepository tagRepository;

    private static final Set<String> STOP_WORDS = Set.of(
        "a","an","the","is","it","in","on","at","to","for","of","and","or","but",
        "not","with","this","that","are","was","be","as","by","from","has","have",
        "had","do","does","did","can","could","will","would","should","my","your",
        "we","i","you","he","she","they","what","how","why","when","where","which"
    );

    public List<String> suggest(String title, String body) {
        String combined = (title == null ? "" : title) + " " + (body == null ? "" : body);
        Set<String> tokens = Arrays.stream(combined.toLowerCase().split("[^a-z0-9#+]+"))
            .filter(t -> t.length() > 2 && !STOP_WORDS.contains(t))
            .collect(Collectors.toSet());

        return tagRepository.findAll().stream()
            .filter(tag -> tokens.stream().anyMatch(t -> tag.getName().contains(t) || t.contains(tag.getName())))
            .map(tag -> tag.getName())
            .limit(5)
            .collect(Collectors.toList());
    }
}
