package com.talkcs.backend.controller;

import com.talkcs.backend.dto.CalendarEventProposalResponse;
import com.talkcs.backend.dto.CalendarEventRequest;
import com.talkcs.backend.dto.CalendarEventResponse;
import com.talkcs.backend.service.CalendarService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/calendar")
@RequiredArgsConstructor
public class CalendarController {
    private final CalendarService calendarService;

    private String currentEmail() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getEventsByMonth(
            @RequestParam int year,
            @RequestParam int month,
            @RequestParam(required = false) Long categoryId) {
        return ResponseEntity.ok(calendarService.getEventsByMonth(year, month, categoryId, currentEmail()));
    }

    @GetMapping("/upcoming")
    public ResponseEntity<Map<String, Object>> getUpcomingEvents(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(defaultValue = "5") int limit) {
        return ResponseEntity.ok(calendarService.getUpcomingEvents(categoryId, limit));
    }

    @PostMapping
    public ResponseEntity<CalendarEventResponse> createEvent(@RequestBody CalendarEventRequest request) {
        return ResponseEntity.ok(calendarService.createEvent(request, currentEmail()));
    }

    @PostMapping("/proposals")
    public ResponseEntity<CalendarEventProposalResponse> submitProposal(@RequestBody CalendarEventRequest request) {
        return ResponseEntity.ok(calendarService.submitProposal(request, currentEmail()));
    }

    @GetMapping("/proposals")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<CalendarEventProposalResponse>> getPendingProposals() {
        return ResponseEntity.ok(calendarService.getPendingProposals());
    }

    @GetMapping("/proposals/mine")
    public ResponseEntity<List<CalendarEventProposalResponse>> getMyProposals() {
        return ResponseEntity.ok(calendarService.getMyProposals(currentEmail()));
    }

    @PutMapping("/proposals/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CalendarEventResponse> approveProposal(@PathVariable Long id) {
        return ResponseEntity.ok(calendarService.approveProposal(id));
    }

    @PutMapping("/proposals/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CalendarEventProposalResponse> rejectProposal(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        String note = body != null ? body.get("adminNote") : null;
        return ResponseEntity.ok(calendarService.rejectProposal(id, note));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CalendarEventResponse> updateEvent(
            @PathVariable Long id,
            @RequestBody CalendarEventRequest request) {
        return ResponseEntity.ok(calendarService.updateEvent(id, request, currentEmail()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEvent(@PathVariable Long id) {
        calendarService.deleteEvent(id, currentEmail());
        return ResponseEntity.noContent().build();
    }
}
