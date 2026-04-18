package com.talkcs.backend.service;

import com.talkcs.backend.model.User;
import com.talkcs.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class MentionService {
    private final UserRepository userRepository;
    private static final Pattern MENTION = Pattern.compile("@(\\w+)");

    public List<User> extractMentions(String text) {
        if (text == null || text.isBlank()) return List.of();
        Matcher m = MENTION.matcher(text);
        return m.results()
            .map(r -> r.group(1))
            .distinct()
            .map(username -> userRepository.findByUsername(username).orElse(null))
            .filter(u -> u != null)
            .toList();
    }
}
