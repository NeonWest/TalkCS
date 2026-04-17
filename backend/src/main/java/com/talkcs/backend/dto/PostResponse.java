package com.talkcs.backend.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

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
    private int voteScore;
    private int userVote;
    private List<String> tags;
}