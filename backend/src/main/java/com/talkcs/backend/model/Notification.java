package com.talkcs.backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
@Entity @Table(name = "notifications")
public class Notification {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "recipient_id")
    private User recipient;

    @Enumerated(EnumType.STRING)
    private NotificationType type;

    private String message;
    private String link;

    @Builder.Default
    private boolean isRead = false;

    private LocalDateTime createdAt;

    public enum NotificationType { MENTION, REPLY, VOTE_MILESTONE, ACCEPTED_ANSWER, FOLLOW }
}
