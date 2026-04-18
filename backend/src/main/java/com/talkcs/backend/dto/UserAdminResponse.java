package com.talkcs.backend.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserAdminResponse {
    private Long id;
    private String username;
    private String email;
    private String role;
    private int reputation;
    private LocalDateTime createdAt;
    private long postCount;
    private long commentCount;
}
