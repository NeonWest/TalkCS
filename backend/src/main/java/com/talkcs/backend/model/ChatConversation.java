package com.talkcs.backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
@Entity @Table(name = "chat_conversations",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_a_id", "user_b_id"}))
public class ChatConversation {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "user_a_id")
    private User userA;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "user_b_id")
    private User userB;

    private LocalDateTime lastMessageAt;

    public User getOtherUser(User me) {
        return userA.getId().equals(me.getId()) ? userB : userA;
    }
}
