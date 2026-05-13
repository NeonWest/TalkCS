package com.talkcs.backend.service;

import com.talkcs.backend.model.User;
import com.talkcs.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MentionServiceTests {

    @Mock private UserRepository userRepository;
    @InjectMocks private MentionService mentionService;

    @Test
    void extractMentions_returnsEmptyForNullOrBlank() {
        assertThat(mentionService.extractMentions(null)).isEmpty();
        assertThat(mentionService.extractMentions("   ")).isEmpty();
    }

    @Test
    void extractMentions_findsValidMentions() {
        User alice = User.builder().id(1L).username("alice").build();
        User bob = User.builder().id(2L).username("bob").build();
        when(userRepository.findByUsername("alice")).thenReturn(Optional.of(alice));
        when(userRepository.findByUsername("bob")).thenReturn(Optional.of(bob));

        List<User> result = mentionService.extractMentions("hey @alice and @bob");
        assertThat(result).extracting(User::getUsername).containsExactlyInAnyOrder("alice", "bob");
    }

    @Test
    void extractMentions_skipsUnknownUsers() {
        when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

        List<User> result = mentionService.extractMentions("hi @ghost");
        assertThat(result).isEmpty();
    }

    @Test
    void extractMentions_deduplicates() {
        User alice = User.builder().id(1L).username("alice").build();
        when(userRepository.findByUsername("alice")).thenReturn(Optional.of(alice));

        List<User> result = mentionService.extractMentions("@alice and @alice again");
        assertThat(result).hasSize(1);
    }
}
