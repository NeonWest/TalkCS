package com.talkcs.backend.dto;

import lombok.*;
import java.time.LocalDate;

@Data @NoArgsConstructor @AllArgsConstructor
public class CalendarEventRequest {
    private String title;
    private String description;
    private LocalDate startDate;
    private LocalDate endDate;
    private Long categoryId;
    private String eventType;
}
