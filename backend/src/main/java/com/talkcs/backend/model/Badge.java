package com.talkcs.backend.model;

import jakarta.persistence.*;
import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
@Entity @Table(name = "badges")
public class Badge {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(unique = true, nullable = false)
    private String name;
    private String description;
    private String iconKey;
    @Enumerated(EnumType.STRING)
    private BadgeType type;

    public enum BadgeType { MILESTONE, SPECIAL }
}
