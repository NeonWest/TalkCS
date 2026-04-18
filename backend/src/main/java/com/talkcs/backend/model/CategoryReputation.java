package com.talkcs.backend.model;

import jakarta.persistence.*;
import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
@Entity @Table(name = "category_reputations",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "category_id"}))
public class CategoryReputation {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "user_id")
    private User user;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "category_id")
    private Category category;
    @Builder.Default
    private int reputation = 0;
}
