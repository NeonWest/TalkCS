package com.talkcs.backend.dto;

import com.talkcs.backend.model.Badge.BadgeType;
import lombok.*;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class BadgeResponse {
    private Long id;
    private String name;
    private String description;
    private String iconKey;
    private BadgeType type;
    private boolean earned;
    private LocalDateTime awardedAt;
}
