package com.talkcs.backend.dto;

import com.talkcs.backend.model.Notification.NotificationType;
import lombok.*;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class NotificationResponse {
    private Long id;
    private NotificationType type;
    private String message;
    private String link;
    private boolean isRead;
    private LocalDateTime createdAt;
}
