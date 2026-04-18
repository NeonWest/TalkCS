package com.talkcs.backend.dto;

import com.talkcs.backend.model.CalendarEvent;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CalendarEventResponse {
    private Long id;
    private String title;
    private String description;
    private LocalDate startDate;
    private LocalDate endDate;
    private Long categoryId;
    private String categoryName;
    private String createdByUsername;
    private String eventType;
    private LocalDateTime createdAt;

    public static CalendarEventResponse from(CalendarEvent e) {
        return CalendarEventResponse.builder()
            .id(e.getId())
            .title(e.getTitle())
            .description(e.getDescription())
            .startDate(e.getStartDate())
            .endDate(e.getEndDate())
            .categoryId(e.getCategory() != null ? e.getCategory().getId() : null)
            .categoryName(e.getCategory() != null ? e.getCategory().getName() : null)
            .createdByUsername(e.getCreatedBy().getUsername())
            .eventType(e.getEventType().toString())
            .createdAt(e.getCreatedAt())
            .build();
    }
}
