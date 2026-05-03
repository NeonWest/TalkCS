package com.talkcs.backend.service;

import com.talkcs.backend.dto.CalendarEventProposalResponse;
import com.talkcs.backend.dto.CalendarEventRequest;
import com.talkcs.backend.dto.CalendarEventResponse;
import com.talkcs.backend.model.*;
import com.talkcs.backend.model.CalendarEventProposal.ProposalStatus;
import com.talkcs.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class CalendarService {
    private final CalendarEventRepository calendarEventRepository;
    private final CalendarEventProposalRepository proposalRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    public Map<String, Object> getEventsByMonth(int year, int month, Long categoryId, String email) {
        YearMonth ym = YearMonth.of(year, month);
        LocalDate start = ym.atDay(1);
        LocalDate end = ym.atEndOfMonth();

        User currentUser = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
        boolean isAdmin = "ADMIN".equals(currentUser.getRole());

        List<CalendarEvent> publicEvents = categoryId != null
            ? calendarEventRepository.findPublicByCategoryAndDateRange(categoryId, start, end)
            : calendarEventRepository.findPublicByDateRange(start, end);

        List<CalendarEvent> privateEvents = isAdmin ? List.of()
            : (categoryId != null
                ? calendarEventRepository.findPrivateByUserAndCategoryAndDateRange(currentUser.getId(), categoryId, start, end)
                : calendarEventRepository.findPrivateByUserAndDateRange(currentUser.getId(), start, end));

        List<CalendarEventResponse> responses = Stream.concat(publicEvents.stream(), privateEvents.stream())
            .sorted(Comparator.comparing(CalendarEvent::getStartDate))
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
        List<CalendarEvent> events = categoryId != null
            ? calendarEventRepository.findUpcomingPublicByCategory(categoryId, today)
            : calendarEventRepository.findUpcomingPublic(today);

        List<CalendarEventResponse> responses = events.stream()
            .limit(limit)
            .map(CalendarEventResponse::from)
            .toList();

        Map<String, Object> result = new HashMap<>();
        result.put("events", responses);
        result.put("count", responses.size());
        return result;
    }

    public CalendarEventResponse createEvent(CalendarEventRequest req, String email) {
        User createdBy = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
        boolean isPrivileged = "ADMIN".equals(createdBy.getRole()) || "PROFESSOR".equals(createdBy.getRole());

        Category category = resolveCategory(req.getCategoryId());

        CalendarEvent event = CalendarEvent.builder()
            .title(req.getTitle())
            .description(req.getDescription())
            .startDate(req.getStartDate())
            .endDate(req.getEndDate())
            .category(category)
            .createdBy(createdBy)
            .eventType(EventType.valueOf(req.getEventType().toUpperCase()))
            .createdAt(LocalDateTime.now())
            .publicEvent(isPrivileged)
            .build();

        return CalendarEventResponse.from(calendarEventRepository.save(event));
    }

    public CalendarEventProposalResponse submitProposal(CalendarEventRequest req, String email) {
        User submittedBy = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));

        Category category = resolveCategory(req.getCategoryId());

        CalendarEventProposal proposal = CalendarEventProposal.builder()
            .title(req.getTitle())
            .description(req.getDescription())
            .startDate(req.getStartDate())
            .endDate(req.getEndDate())
            .eventType(EventType.valueOf(req.getEventType().toUpperCase()))
            .category(category)
            .submittedBy(submittedBy)
            .createdAt(LocalDateTime.now())
            .build();

        return CalendarEventProposalResponse.from(proposalRepository.save(proposal));
    }

    public List<CalendarEventProposalResponse> getPendingProposals() {
        return proposalRepository.findByStatusOrderByCreatedAtDesc(ProposalStatus.PENDING)
            .stream().map(CalendarEventProposalResponse::from).toList();
    }

    public List<CalendarEventProposalResponse> getMyProposals(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
        return proposalRepository.findBySubmittedByIdOrderByCreatedAtDesc(user.getId())
            .stream().map(CalendarEventProposalResponse::from).toList();
    }

    @Transactional
    public CalendarEventResponse approveProposal(Long proposalId) {
        CalendarEventProposal proposal = proposalRepository.findById(proposalId)
            .orElseThrow(() -> new RuntimeException("Proposal not found"));

        CalendarEvent event = CalendarEvent.builder()
            .title(proposal.getTitle())
            .description(proposal.getDescription())
            .startDate(proposal.getStartDate())
            .endDate(proposal.getEndDate())
            .eventType(proposal.getEventType())
            .category(proposal.getCategory())
            .createdBy(proposal.getSubmittedBy())
            .createdAt(LocalDateTime.now())
            .publicEvent(true)
            .build();

        CalendarEventResponse response = CalendarEventResponse.from(calendarEventRepository.save(event));
        proposal.setStatus(ProposalStatus.APPROVED);
        proposalRepository.save(proposal);
        return response;
    }

    public CalendarEventProposalResponse rejectProposal(Long proposalId, String adminNote) {
        CalendarEventProposal proposal = proposalRepository.findById(proposalId)
            .orElseThrow(() -> new RuntimeException("Proposal not found"));

        proposal.setStatus(ProposalStatus.REJECTED);
        proposal.setAdminNote(adminNote);
        return CalendarEventProposalResponse.from(proposalRepository.save(proposal));
    }

    public CalendarEventResponse updateEvent(Long id, CalendarEventRequest req, String email) {
        CalendarEvent event = calendarEventRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Event not found"));
        User currentUser = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));

        boolean canEdit = event.getCreatedBy().getId().equals(currentUser.getId())
            || "ADMIN".equals(currentUser.getRole()) || "PROFESSOR".equals(currentUser.getRole());
        if (!canEdit) throw new RuntimeException("Unauthorized");

        event.setTitle(req.getTitle());
        event.setDescription(req.getDescription());
        event.setStartDate(req.getStartDate());
        event.setEndDate(req.getEndDate());
        event.setEventType(EventType.valueOf(req.getEventType().toUpperCase()));
        event.setCategory(resolveCategory(req.getCategoryId()));

        return CalendarEventResponse.from(calendarEventRepository.save(event));
    }

    public void deleteEvent(Long id, String email) {
        CalendarEvent event = calendarEventRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Event not found"));
        User currentUser = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));

        boolean canDelete = event.getCreatedBy().getId().equals(currentUser.getId())
            || "ADMIN".equals(currentUser.getRole()) || "PROFESSOR".equals(currentUser.getRole());
        if (!canDelete) throw new RuntimeException("Unauthorized");

        calendarEventRepository.deleteById(id);
    }

    private Category resolveCategory(Long categoryId) {
        if (categoryId == null) return null;
        return categoryRepository.findById(categoryId)
            .orElseThrow(() -> new RuntimeException("Category not found"));
    }
}
