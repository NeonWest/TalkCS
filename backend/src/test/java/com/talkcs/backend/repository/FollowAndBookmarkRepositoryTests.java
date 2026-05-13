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
class FollowAndBookmarkRepositoryTests {

    @Autowired private FollowRepository followRepository;
    @Autowired private BookmarkRepository bookmarkRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private PostRepository postRepository;
    @Autowired private CategoryRepository categoryRepository;

    @BeforeEach
    void setUp() {
        followRepository.deleteAll();
        bookmarkRepository.deleteAll();
        postRepository.deleteAll();
        userRepository.deleteAll();
        categoryRepository.deleteAll();
    }

    @Test
    void follow_existsAndCountWorks() {
        User a = userRepository.save(User.builder().username("a").email("a@t.com").build());
        User b = userRepository.save(User.builder().username("b").email("b@t.com").build());
        followRepository.save(Follow.builder().follower(a).following(b).createdAt(LocalDateTime.now()).build());

        assertThat(followRepository.existsByFollowerIdAndFollowingId(a.getId(), b.getId())).isTrue();
        assertThat(followRepository.countByFollowingId(b.getId())).isEqualTo(1L);
        assertThat(followRepository.countByFollowerId(a.getId())).isEqualTo(1L);
    }

    @Test
    void bookmark_uniqueAndListByUser() {
        User u = userRepository.save(User.builder().username("u").email("u@t.com").build());
        Category c = categoryRepository.save(Category.builder().name("G").build());
        Post p = postRepository.save(Post.builder().title("t").body("b").author(u).category(c)
            .status(PostStatus.OPEN).createdAt(LocalDateTime.now()).build());
        bookmarkRepository.save(Bookmark.builder().user(u).post(p).createdAt(LocalDateTime.now()).build());

        assertThat(bookmarkRepository.existsByUserIdAndPostId(u.getId(), p.getId())).isTrue();
        assertThat(bookmarkRepository.findByUserId(u.getId())).hasSize(1);
    }
}
