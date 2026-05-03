package com.talkcs.backend.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CommentResponse{
    private Long id;
    private String body;
    private LocalDateTime createdAt;
    private String authorUsername;
    private List<CommentResponse> children;
    private int voteScore;
    private int userVote;
    private String authorLevel;
    private String authorRole;
}