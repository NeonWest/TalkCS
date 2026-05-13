package com.talkcs.backend.service;

import com.talkcs.backend.dto.SimilarPostResponse;
import com.talkcs.backend.model.Post;
import com.talkcs.backend.model.Tag;
import com.talkcs.backend.repository.PostRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SimilarityServiceTests {

    @Mock private PostRepository postRepository;
    @InjectMocks private SimilarityService similarityService;

    @Test
    void findSimilar_returnsEmptyForEmptyCorpus() {
        when(postRepository.findByCategoryId(1L)).thenReturn(List.of());
        assertThat(similarityService.findSimilar("title", "body", 1L, List.of())).isEmpty();
    }

    @Test
    void findSimilar_rankRelevantPostHigher() {
        Tag tagA = Tag.builder().name("kotlin").build();
        Tag tagB = Tag.builder().name("python").build();
        Post relevant = Post.builder().id(1L).title("Kotlin coroutines explained")
            .body("Kotlin coroutines structure concurrency cleanly with suspend functions and dispatchers.")
            .tags(Set.of(tagA)).build();
        Post irrelevant = Post.builder().id(2L).title("Recipe for sourdough")
            .body("Bread baking with starter and flour overnight rise temperature humidity.")
            .tags(Set.of(tagB)).build();
        when(postRepository.findByCategoryId(1L)).thenReturn(List.of(relevant, irrelevant));

        List<SimilarPostResponse> results = similarityService.findSimilar(
            "Kotlin coroutines question",
            "How do Kotlin coroutines compare to threads?",
            1L,
            List.of("kotlin"));

        assertThat(results).isNotEmpty();
        assertThat(results.get(0).getId()).isEqualTo(1L);
    }
}
