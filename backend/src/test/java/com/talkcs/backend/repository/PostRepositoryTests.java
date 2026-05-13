package com.talkcs.backend.repository;

import com.talkcs.backend.model.Category;
import com.talkcs.backend.model.Post;
import com.talkcs.backend.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
class PostRepositoryTests {

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    private User author;
    private Category category;

    @BeforeEach
    void setUp() {
        postRepository.deleteAll();
        userRepository.deleteAll();
        categoryRepository.deleteAll();

        author = User.builder()
                .username("author")
                .email("author@test.com")
                .build();
        userRepository.save(author);

        category = Category.builder()
                .name("General")
                .description("General Discussion")
                .build();
        categoryRepository.save(category);
    }

    @Test
    void findByCategoryId_ShouldReturnPosts() {
        // Given
        Post post = Post.builder()
                .title("Test Post")
                .body("Content")
                .author(author)
                .category(category)
                .status(com.talkcs.backend.model.PostStatus.OPEN)
                .createdAt(LocalDateTime.now())
                .build();
        postRepository.save(post);

        // When
        Page<Post> postsPage = postRepository.findByCategoryId(category.getId(), PageRequest.of(0, 10));

        // Then
        assertThat(postsPage.getContent()).hasSize(1);
        assertThat(postsPage.getContent().get(0).getTitle()).isEqualTo("Test Post");
    }

    @Test
    void findByTitleContainingIgnoreCaseOrBodyContainingIgnoreCase_ShouldReturnMatchingPosts() {
        // Given
        postRepository.save(Post.builder()
                .title("Java Spring")
                .body("Spring is great")
                .author(author)
                .category(category)
                .status(com.talkcs.backend.model.PostStatus.OPEN)
                .createdAt(LocalDateTime.now())
                .build());
        postRepository.save(Post.builder()
                .title("React")
                .body("Frontend stuff")
                .author(author)
                .category(category)
                .status(com.talkcs.backend.model.PostStatus.OPEN)
                .createdAt(LocalDateTime.now())
                .build());

        // When
        List<Post> results = postRepository.findByTitleContainingIgnoreCaseOrBodyContainingIgnoreCase("java", "java");

        // Then
        assertThat(results).hasSize(1);
        assertThat(results.get(0).getTitle()).isEqualTo("Java Spring");
    }

    @Test
    void countByAuthorId_ShouldReturnCorrectCount() {
        // Given
        postRepository.save(Post.builder().title("P1").body("B1").author(author).category(category).status(com.talkcs.backend.model.PostStatus.OPEN).createdAt(LocalDateTime.now()).build());
        postRepository.save(Post.builder().title("P2").body("B2").author(author).category(category).status(com.talkcs.backend.model.PostStatus.OPEN).createdAt(LocalDateTime.now()).build());

        // When
        long count = postRepository.countByAuthorId(author.getId());

        // Then
        assertThat(count).isEqualTo(2);
    }
}
