package com.talkcs.backend.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data @Builder
public class ChatMessageResponse {
    private Long id;
    private Long conversationId;
    private String senderUsername;
    private String content;
    private LocalDateTime sentAt;
    private boolean isRead;
}
