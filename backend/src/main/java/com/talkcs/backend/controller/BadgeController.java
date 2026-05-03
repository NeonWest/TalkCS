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
        
        var milestones = badgeService.getAllMilestoneBadgesForUser(user.getId());
        var specials = badgeService.getSpecialBadgesForUser(user.getId());
        
        return java.util.stream.Stream.concat(milestones.stream(), specials.stream()).toList();
    }
}
