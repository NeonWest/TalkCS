package com.talkcs.backend.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PostResponse{
    private Long id;
    private String title;
    private String body;
    private LocalDateTime createdAt;
    private String authorUsername;
    private int commentCount;
}