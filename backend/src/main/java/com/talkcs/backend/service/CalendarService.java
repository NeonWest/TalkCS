package com.talkcs.backend.service;

import com.talkcs.backend.dto.CalendarEventRequest;
import com.talkcs.backend.dto.CalendarEventResponse;
import com.talkcs.backend.model.CalendarEvent;
import com.talkcs.backend.model.Category;
import com.talkcs.backend.model.EventType;
import com.talkcs.backend.model.User;
import com.talkcs.backend.repository.CalendarEventRepository;
import com.talkcs.backend.repository.CategoryRepository;
import com.talkcs.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CalendarService {
    private final CalendarEventRepository calendarEventRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    public Map<String, Object> getEventsByMonth(int year, int month, Long categoryId) {
        YearMonth yearMonth = YearMonth.of(year, month);
        LocalDate start = yearMonth.atDay(1);
        LocalDate end = yearMonth.atEndOfMonth();

        List<CalendarEvent> events;
        if (categoryId != null) {
            events = calendarEventRepository.findByCategoryIdAndStartDateBetweenOrderByStartDateAsc(categoryId, start, end);
        } else {
            events = calendarEventRepository.findByStartDateBetweenOrderByStartDateAsc(start, end);
        }

        List<CalendarEventResponse> responses = events.stream()
            .map(CalendarEventResponse::from)
            .toList();

        Map<String, Object> result = new HashMap<>();
        result.put("events", responses);
        result.put("year", year);
        result.put("month", month);
        return result;
    }

    public Map<String, Object> getUpcomingEvents(Long categoryId, int limit) {
        LocalDate today = LocalDate.now();
        List<CalendarEvent> events;

        if (categoryId != null) {
            events = calendarEventRepository.findByCategoryIdAndStartDateGreaterThanEqualOrderByStartDateAsc(categoryId, today);
        } else {
            events = calendarEventRepository.findByStartDateGreaterThanEqualOrderByStartDateAsc(today);
        }

        List<CalendarEventResponse> responses = events.stream()
            .limit(limit)
            .map(CalendarEventResponse::from)
            .toList();

        Map<String, Object> result = new HashMap<>();
        result.put("events", responses);
        result.put("count", responses.size());
        return result;
    }

    public CalendarEventResponse createEvent(CalendarEventRequest req, String username) {
        User createdBy = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));

        Category category = null;
        if (req.getCategoryId() != null) {
            category = categoryRepository.findById(req.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found"));
        }

        CalendarEvent event = CalendarEvent.builder()
            .title(req.getTitle())
            .description(req.getDescription())
            .startDate(req.getStartDate())
            .endDate(req.getEndDate())
            .category(category)
            .createdBy(createdBy)
            .eventType(EventType.valueOf(req.getEventType().toUpperCase()))
            .createdAt(LocalDateTime.now())
            .build();

        CalendarEvent saved = calendarEventRepository.save(event);
        return CalendarEventResponse.from(saved);
    }

    public CalendarEventResponse updateEvent(Long id, CalendarEventRequest req, String username) {
        CalendarEvent event = calendarEventRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Event not found"));

        User currentUser = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));

        if (!event.getCreatedBy().getUsername().equals(username)) {
            if (!"ADMIN".equals(currentUser.getRole())) {
                throw new RuntimeException("Unauthorized");
            }
        }

        event.setTitle(req.getTitle());
        event.setDescription(req.getDescription());
        event.setStartDate(req.getStartDate());
        event.setEndDate(req.getEndDate());
        event.setEventType(EventType.valueOf(req.getEventType().toUpperCase()));

        if (req.getCategoryId() != null) {
            Category category = categoryRepository.findById(req.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found"));
            event.setCategory(category);
        } else {
            event.setCategory(null);
        }

        CalendarEvent updated = calendarEventRepository.save(event);
        return CalendarEventResponse.from(updated);
    }

    public void deleteEvent(Long id, String username) {
        CalendarEvent event = calendarEventRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Event not found"));

        User currentUser = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));

        if (!event.getCreatedBy().getUsername().equals(username)) {
            if (!"ADMIN".equals(currentUser.getRole())) {
                throw new RuntimeException("Unauthorized");
            }
        }

        calendarEventRepository.deleteById(id);
    }
}
