package com.talkcs.backend.repository;

import com.talkcs.backend.model.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
class CommentRepositoryTests {

    @Autowired private CommentRepository commentRepository;
    @Autowired private PostRepository postRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private CategoryRepository categoryRepository;

    private Post post;
    private User author;

    @BeforeEach
    void setUp() {
        commentRepository.deleteAll();
        postRepository.deleteAll();
        userRepository.deleteAll();
        categoryRepository.deleteAll();

        author = userRepository.save(User.builder().username("a").email("a@t.com").build());
        Category c = categoryRepository.save(Category.builder().name("G").build());
        post = postRepository.save(Post.builder().title("t").body("b").author(author).category(c)
            .status(PostStatus.OPEN).createdAt(LocalDateTime.now()).build());
    }

    @Test
    void findByPostIdAndParentIsNull_returnsOnlyRoots() {
        Comment root = commentRepository.save(Comment.builder().body("root").author(author).post(post).createdAt(LocalDateTime.now()).build());
        commentRepository.save(Comment.builder().body("child").author(author).post(post).parent(root).createdAt(LocalDateTime.now()).build());

        assertThat(commentRepository.findByPostIdAndParentIsNull(post.getId())).hasSize(1);
    }

    @Test
    void countByPostId_countsAll() {
        commentRepository.save(Comment.builder().body("a").author(author).post(post).createdAt(LocalDateTime.now()).build());
        commentRepository.save(Comment.builder().body("b").author(author).post(post).createdAt(LocalDateTime.now()).build());
        assertThat(commentRepository.countByPostId(post.getId())).isEqualTo(2);
    }

    @Test
    void countByAuthorId_isAuthorScoped() {
        commentRepository.save(Comment.builder().body("a").author(author).post(post).createdAt(LocalDateTime.now()).build());
        assertThat(commentRepository.countByAuthorId(author.getId())).isEqualTo(1L);
    }
}
