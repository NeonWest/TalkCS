package com.talkcs.backend.repository;

import com.talkcs.backend.model.Category;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
class CategoryRepositoryTests {

    @Autowired private CategoryRepository categoryRepository;

    @BeforeEach
    void setUp() { categoryRepository.deleteAll(); }

    @Test
    void findByArchivedFalse_excludesArchived() {
        categoryRepository.save(Category.builder().name("Active").archived(false).build());
        categoryRepository.save(Category.builder().name("Hidden").archived(true).build());

        assertThat(categoryRepository.findByArchivedFalse()).extracting(Category::getName).containsExactly("Active");
    }

    @Test
    void existsByName_returnsTrueForMatching() {
        categoryRepository.save(Category.builder().name("Java").build());
        assertThat(categoryRepository.existsByName("Java")).isTrue();
        assertThat(categoryRepository.existsByName("Other")).isFalse();
    }

    @Test
    void findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase_matches() {
        categoryRepository.save(Category.builder().name("Java Devs").description("for java users").build());
        var matches = categoryRepository.findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase("java", "x");
        assertThat(matches).hasSize(1);
    }
}
