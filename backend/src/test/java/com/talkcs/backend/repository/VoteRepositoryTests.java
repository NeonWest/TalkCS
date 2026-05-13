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
class VoteRepositoryTests {

    @Autowired private VoteRepository voteRepository;
    @Autowired private PostRepository postRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private CategoryRepository categoryRepository;

    private User voter;
    private Post post;

    @BeforeEach
    void setUp() {
        voteRepository.deleteAll();
        postRepository.deleteAll();
        userRepository.deleteAll();
        categoryRepository.deleteAll();

        voter = userRepository.save(User.builder().username("v").email("v@t.com").build());
        User author = userRepository.save(User.builder().username("a").email("a@t.com").build());
        Category c = categoryRepository.save(Category.builder().name("G").build());
        post = postRepository.save(Post.builder().title("t").body("b").author(author).category(c)
            .status(PostStatus.OPEN).createdAt(LocalDateTime.now()).build());
    }

    @Test
    void findByVoterIdAndPostId_returnsVote() {
        voteRepository.save(Vote.builder().voter(voter).post(post).value(1).createdAt(LocalDateTime.now()).build());
        assertThat(voteRepository.findByVoterIdAndPostId(voter.getId(), post.getId())).isPresent();
    }

    @Test
    void countByPostIdAndValue_filtersByValue() {
        voteRepository.save(Vote.builder().voter(voter).post(post).value(1).createdAt(LocalDateTime.now()).build());
        assertThat(voteRepository.countByPostIdAndValue(post.getId(), 1)).isEqualTo(1);
        assertThat(voteRepository.countByPostIdAndValue(post.getId(), -1)).isZero();
    }
}
