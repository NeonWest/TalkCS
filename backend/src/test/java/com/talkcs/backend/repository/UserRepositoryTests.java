package com.talkcs.backend.repository;

import com.talkcs.backend.model.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
class UserRepositoryTests {

    @Autowired
    private UserRepository userRepository;

    @org.junit.jupiter.api.BeforeEach
    void cleanUp() {
        userRepository.deleteAll();
    }

    @Test
    void findByEmail_ShouldReturnUser_WhenUserExists() {
        // Given
        User user = User.builder()
                .username("testuser")
                .email("test@example.com")
                .password("password")
                .role("USER")
                .build();
        userRepository.save(user);

        // When
        Optional<User> found = userRepository.findByEmail("test@example.com");

        // Then
        assertThat(found).isPresent();
        assertThat(found.get().getUsername()).isEqualTo("testuser");
    }

    @Test
    void findByUsername_ShouldReturnUser_WhenUserExists() {
        // Given
        User user = User.builder()
                .username("uniqueUser")
                .email("unique@example.com")
                .password("password")
                .build();
        userRepository.save(user);

        // When
        Optional<User> found = userRepository.findByUsername("uniqueUser");

        // Then
        assertThat(found).isPresent();
        assertThat(found.get().getEmail()).isEqualTo("unique@example.com");
    }

    @Test
    void findTop20ByOrderByReputationDesc_ShouldReturnSortedUsers() {
        // Given
        userRepository.save(User.builder().username("user1").email("u1@ex.com").reputation(10).build());
        userRepository.save(User.builder().username("user2").email("u2@ex.com").reputation(50).build());
        userRepository.save(User.builder().username("user3").email("u3@ex.com").reputation(30).build());

        // When
        List<User> topUsers = userRepository.findTop20ByOrderByReputationDesc();

        // Then
        assertThat(topUsers).hasSize(3);
        assertThat(topUsers.get(0).getUsername()).isEqualTo("user2");
        assertThat(topUsers.get(1).getUsername()).isEqualTo("user3");
        assertThat(topUsers.get(2).getUsername()).isEqualTo("user1");
    }

    @Test
    void existsByEmail_ShouldReturnTrue_WhenEmailExists() {
        // Given
        userRepository.save(User.builder().username("euser").email("exists@example.com").build());

        // When & Then
        assertThat(userRepository.existsByEmail("exists@example.com")).isTrue();
        assertThat(userRepository.existsByEmail("notfound@example.com")).isFalse();
    }
}
