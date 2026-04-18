package com.talkcs.backend.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data @Builder
public class ChatConversationResponse {
    private Long id;
    private String otherUsername;
    private String lastMessage;
    private LocalDateTime lastMessageAt;
    private long unreadCount;
}
