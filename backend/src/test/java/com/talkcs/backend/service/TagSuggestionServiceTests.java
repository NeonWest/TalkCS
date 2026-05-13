package com.talkcs.backend.service;

import com.talkcs.backend.model.Tag;
import com.talkcs.backend.repository.TagRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TagSuggestionServiceTests {

    @Mock private TagRepository tagRepository;
    @InjectMocks private TagSuggestionService tagSuggestionService;

    @Test
    void suggest_matchesTokensWithTagNames() {
        when(tagRepository.findAll()).thenReturn(List.of(
            Tag.builder().name("java").build(),
            Tag.builder().name("python").build(),
            Tag.builder().name("docker").build()
        ));

        List<String> suggestions = tagSuggestionService.suggest("How do I run java in docker?", "");
        assertThat(suggestions).contains("java", "docker").doesNotContain("python");
    }

    @Test
    void suggest_filtersStopWordsAndShortTokens() {
        when(tagRepository.findAll()).thenReturn(List.of(Tag.builder().name("the").build()));
        // "the" is a stopword in tokenizer, but tagRepository name "the" wouldn't match anyway
        List<String> out = tagSuggestionService.suggest("the is on", "");
        assertThat(out).isEmpty();
    }

    @Test
    void suggest_returnsEmptyWhenNothingMatches() {
        when(tagRepository.findAll()).thenReturn(List.of(Tag.builder().name("rust").build()));
        assertThat(tagSuggestionService.suggest("learning kotlin compose", null)).isEmpty();
    }

    @Test
    void suggest_limitsToFive() {
        // create 10 matching tags
        List<Tag> many = java.util.stream.IntStream.range(0, 10)
            .mapToObj(i -> Tag.builder().name("kotlin" + i).build()).toList();
        when(tagRepository.findAll()).thenReturn(many);
        List<String> out = tagSuggestionService.suggest("kotlin0 kotlin1 kotlin2 kotlin3 kotlin4 kotlin5 kotlin6", "");
        assertThat(out).hasSizeLessThanOrEqualTo(5);
    }
}
