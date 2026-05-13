package com.talkcs.backend.repository;

import com.talkcs.backend.model.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
class TagRepositoryTests {

    @Autowired private TagRepository tagRepository;
    @Autowired private PostRepository postRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private CategoryRepository categoryRepository;

    @BeforeEach
    void setUp() {
        postRepository.deleteAll();
        tagRepository.deleteAll();
        userRepository.deleteAll();
        categoryRepository.deleteAll();
    }

    @Test
    void findByName_returnsTag() {
        tagRepository.save(Tag.builder().name("java").build());
        assertThat(tagRepository.findByName("java")).isPresent();
    }

    @Test
    void findPopularTags_ordersByUsage() {
        Tag java = tagRepository.save(Tag.builder().name("java").build());
        Tag rust = tagRepository.save(Tag.builder().name("rust").build());
        User u = userRepository.save(User.builder().username("u").email("u@t.com").build());
        Category c = categoryRepository.save(Category.builder().name("G").build());

        postRepository.save(Post.builder().title("p1").body("b").author(u).category(c)
            .status(PostStatus.OPEN).tags(Set.of(java)).createdAt(LocalDateTime.now()).build());
        postRepository.save(Post.builder().title("p2").body("b").author(u).category(c)
            .status(PostStatus.OPEN).tags(Set.of(java, rust)).createdAt(LocalDateTime.now()).build());

        var popular = tagRepository.findPopularTags(PageRequest.of(0, 10));
        assertThat(popular.get(0).getName()).isEqualTo("java");
    }
}
