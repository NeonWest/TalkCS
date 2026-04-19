package com.talkcs.backend.dto;

import com.talkcs.backend.model.CalendarEventProposal;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CalendarEventProposalResponse {
    private Long id;
    private String title;
    private String description;
    private LocalDate startDate;
    private LocalDate endDate;
    private String eventType;
    private Long categoryId;
    private String categoryName;
    private String submittedByUsername;
    private String status;
    private String adminNote;
    private LocalDateTime createdAt;

    public static CalendarEventProposalResponse from(CalendarEventProposal p) {
        return CalendarEventProposalResponse.builder()
            .id(p.getId())
            .title(p.getTitle())
            .description(p.getDescription())
            .startDate(p.getStartDate())
            .endDate(p.getEndDate())
            .eventType(p.getEventType().toString())
            .categoryId(p.getCategory() != null ? p.getCategory().getId() : null)
            .categoryName(p.getCategory() != null ? p.getCategory().getName() : null)
            .submittedByUsername(p.getSubmittedBy().getUsername())
            .status(p.getStatus().toString())
            .adminNote(p.getAdminNote())
            .createdAt(p.getCreatedAt())
            .build();
    }
}
