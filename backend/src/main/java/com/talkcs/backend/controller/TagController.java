package com.talkcs.backend.controller;

import com.talkcs.backend.service.TagService;
import com.talkcs.backend.service.TagSuggestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tags")
@RequiredArgsConstructor
public class TagController {
    private final TagService tagService;
    private final TagSuggestionService tagSuggestionService;

    @GetMapping
    public ResponseEntity<List<String>> getAllTags() {
        return ResponseEntity.ok(tagService.getAllTags().stream().map(t -> t.getName()).toList());
    }

    @GetMapping("/popular")
    public ResponseEntity<List<String>> getPopularTags() {
        return ResponseEntity.ok(tagService.getPopularTags().stream().map(t -> t.getName()).toList());
    }

    @PostMapping("/suggest")
    public ResponseEntity<List<String>> suggest(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(tagSuggestionService.suggest(body.get("title"), body.get("body")));
    }
}
