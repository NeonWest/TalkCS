package com.talkcs.backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
@Entity @Table(name = "calendar_events")
public class CalendarEvent {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    private String description;

    private LocalDate startDate;

    private LocalDate endDate;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "category_id")
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "created_by_id")
    private User createdBy;

    @Enumerated(EnumType.STRING)
    private EventType eventType;

    private LocalDateTime createdAt;
}
