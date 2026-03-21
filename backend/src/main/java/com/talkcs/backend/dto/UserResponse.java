package com.talkcs.backend.dto;
import lombok.*;
import java.time.LocalDateTime;

@Data 
@Builder 
@AllArgsConstructor 
@NoArgsConstructor
public class UserResponse {
    private Long id;
    private String username;
    private LocalDateTime createdAt;
    private String role;
    private long postCount;
    private long commentCount;
    private int reputation;
}