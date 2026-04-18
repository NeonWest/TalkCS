package com.talkcs.backend.controller;

import com.talkcs.backend.dto.BadgeResponse;
import com.talkcs.backend.model.UserBadge;
import com.talkcs.backend.repository.UserRepository;
import com.talkcs.backend.service.BadgeService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class BadgeController {
    private final BadgeService badgeService;
    private final UserRepository userRepository;

    @GetMapping("/{username}/badges")
    public List<BadgeResponse> getBadges(@PathVariable String username) {
        var user = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));
        return badgeService.getUserBadges(user.getId()).stream()
            .map(ub -> BadgeResponse.builder()
                .id(ub.getBadge().getId())
                .name(ub.getBadge().getName())
                .description(ub.getBadge().getDescription())
                .iconKey(ub.getBadge().getIconKey())
                .type(ub.getBadge().getType())
                .awardedAt(ub.getAwardedAt())
                .build())
            .toList();
    }
}
