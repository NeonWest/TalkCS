package com.talkcs.backend.dto;

import com.talkcs.backend.model.PostStatus;
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
    private PostStatus status;
    private Long acceptedAnswerId;
    private String authorLevel;
    private boolean bookmarkedByCurrentUser;
}