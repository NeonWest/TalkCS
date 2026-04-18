package com.talkcs.backend.controller;

import com.talkcs.backend.dto.CalendarEventRequest;
import com.talkcs.backend.dto.CalendarEventResponse;
import com.talkcs.backend.service.CalendarService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/calendar")
@RequiredArgsConstructor
public class CalendarController {
    private final CalendarService calendarService;

    private String getCurrentUsername() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getEventsByMonth(
            @RequestParam int year,
            @RequestParam int month,
            @RequestParam(required = false) Long categoryId) {
        return ResponseEntity.ok(calendarService.getEventsByMonth(year, month, categoryId));
    }

    @GetMapping("/upcoming")
    public ResponseEntity<Map<String, Object>> getUpcomingEvents(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(defaultValue = "5") int limit) {
        return ResponseEntity.ok(calendarService.getUpcomingEvents(categoryId, limit));
    }

    @PostMapping
    public ResponseEntity<CalendarEventResponse> createEvent(@RequestBody CalendarEventRequest request) {
        String username = getCurrentUsername();
        CalendarEventResponse response = calendarService.createEvent(request, username);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CalendarEventResponse> updateEvent(
            @PathVariable Long id,
            @RequestBody CalendarEventRequest request) {
        String username = getCurrentUsername();
        CalendarEventResponse response = calendarService.updateEvent(id, request, username);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEvent(@PathVariable Long id) {
        String username = getCurrentUsername();
        calendarService.deleteEvent(id, username);
        return ResponseEntity.noContent().build();
    }
}
