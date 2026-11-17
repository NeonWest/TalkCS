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

    @Autowired
    private VoteRepository voteRepository;

    @Autowired
    private CommentRepository commentRepository;

    private User author;
    private Category category;

    @BeforeEach
    void setUp() {
        voteRepository.deleteAll();
        commentRepository.deleteAll();
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

    private Post savePost(String title, LocalDateTime createdAt) {
        return postRepository.save(Post.builder().title(title).body("b").author(author).category(category)
                .status(com.talkcs.backend.model.PostStatus.OPEN).createdAt(createdAt).build());
    }

    private User saveUser(String name) {
        return userRepository.save(User.builder().username(name).email(name + "@test.com").build());
    }

    @Test
    void findByCategoryIdOrderByVoteScore_ordersAcrossPages() {
        LocalDateTime now = LocalDateTime.now();
        Post oldPopular = savePost("old popular", now.minusDays(3));
        Post middle = savePost("middle", now.minusDays(2));
        Post newest = savePost("newest", now.minusDays(1));
        User v1 = saveUser("v1"), v2 = saveUser("v2");
        voteRepository.save(com.talkcs.backend.model.Vote.builder().voter(v1).post(oldPopular).value(1).createdAt(now).build());
        voteRepository.save(com.talkcs.backend.model.Vote.builder().voter(v2).post(oldPopular).value(1).createdAt(now).build());
        voteRepository.save(com.talkcs.backend.model.Vote.builder().voter(v1).post(newest).value(-1).createdAt(now).build());

        Page<Post> first = postRepository.findByCategoryIdOrderByVoteScore(category.getId(), PageRequest.of(0, 1));
        Page<Post> second = postRepository.findByCategoryIdOrderByVoteScore(category.getId(), PageRequest.of(1, 1));
        Page<Post> third = postRepository.findAllOrderByVoteScore(PageRequest.of(2, 1));

        assertThat(first.getContent()).extracting(Post::getTitle).containsExactly("old popular");
        assertThat(second.getContent()).extracting(Post::getTitle).containsExactly("middle");
        assertThat(third.getContent()).extracting(Post::getTitle).containsExactly("newest");
        assertThat(first.getTotalElements()).isEqualTo(3);
    }

    @Test
    void findByCategoryIdOrderByCommentCount_ordersAcrossPages() {
        LocalDateTime now = LocalDateTime.now();
        Post oldBusy = savePost("old busy", now.minusDays(3));
        savePost("quiet newest", now.minusDays(1));
        for (int i = 0; i < 2; i++) {
            commentRepository.save(com.talkcs.backend.model.Comment.builder().body("c" + i).author(author)
                    .post(oldBusy).createdAt(now).build());
        }

        Page<Post> first = postRepository.findByCategoryIdOrderByCommentCount(category.getId(), PageRequest.of(0, 1));
        Page<Post> all = postRepository.findAllOrderByCommentCount(PageRequest.of(0, 10));

        assertThat(first.getContent()).extracting(Post::getTitle).containsExactly("old busy");
        assertThat(first.getTotalPages()).isEqualTo(2);
        assertThat(all.getContent()).extracting(Post::getTitle).containsExactly("old busy", "quiet newest");
    }

    @Test
    void save_acceptsPostAndCommentBodiesLongerThan255Characters() {
        String longBody = "x".repeat(5000);
        Post post = postRepository.saveAndFlush(Post.builder().title("Long").body(longBody).author(author)
                .category(category).status(com.talkcs.backend.model.PostStatus.OPEN).createdAt(LocalDateTime.now()).build());
        com.talkcs.backend.model.Comment comment = commentRepository.saveAndFlush(com.talkcs.backend.model.Comment.builder()
                .body(longBody).author(author).post(post).createdAt(LocalDateTime.now()).build());

        assertThat(postRepository.findById(post.getId()).orElseThrow().getBody()).hasSize(5000);
        assertThat(commentRepository.findById(comment.getId()).orElseThrow().getBody()).hasSize(5000);
    }
}
