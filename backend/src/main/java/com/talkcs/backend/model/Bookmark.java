package com.talkcs.backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
@Entity @Table(name = "bookmarks",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "post_id"}))
public class Bookmark {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "user_id")
    private User user;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "post_id")
    private Post post;
    private LocalDateTime createdAt;
}
