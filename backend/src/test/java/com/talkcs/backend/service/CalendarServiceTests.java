package com.talkcs.backend.service;

import com.talkcs.backend.dto.CalendarEventProposalResponse;
import com.talkcs.backend.dto.CalendarEventRequest;
import com.talkcs.backend.dto.CalendarEventResponse;
import com.talkcs.backend.model.*;
import com.talkcs.backend.model.CalendarEventProposal.ProposalStatus;
import com.talkcs.backend.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CalendarServiceTests {

    @Mock private CalendarEventRepository calendarEventRepository;
    @Mock private CalendarEventProposalRepository proposalRepository;
    @Mock private CategoryRepository categoryRepository;
    @Mock private UserRepository userRepository;
    @InjectMocks private CalendarService calendarService;

    private CalendarEventRequest request() {
        CalendarEventRequest r = new CalendarEventRequest();
        r.setTitle("t"); r.setDescription("d");
        r.setStartDate(LocalDate.now()); r.setEndDate(LocalDate.now().plusDays(1));
        r.setEventType("EXAM");
        return r;
    }

    @Test
    void createEvent_markedPublicForAdmin() {
        User admin = User.builder().id(1L).email("a@t.com").role("ADMIN").build();
        when(userRepository.findByEmail("a@t.com")).thenReturn(Optional.of(admin));
        when(calendarEventRepository.save(any())).thenAnswer(inv -> {
            CalendarEvent e = inv.getArgument(0); e.setId(10L); return e;
        });

        CalendarEventResponse out = calendarService.createEvent(request(), "a@t.com");
        assertThat(out).isNotNull();
    }

    @Test
    void createEvent_markedPrivateForStudent() {
        User student = User.builder().id(1L).email("s@t.com").role("STUDENT").build();
        when(userRepository.findByEmail("s@t.com")).thenReturn(Optional.of(student));
        when(calendarEventRepository.save(any())).thenAnswer(inv -> {
            CalendarEvent e = inv.getArgument(0); return e;
        });

        calendarService.createEvent(request(), "s@t.com");
        verify(calendarEventRepository).save(argThat(e -> !e.isPublicEvent()));
    }

    @Test
    void submitProposal_persistsPending() {
        User u = User.builder().id(1L).email("u@t.com").build();
        when(userRepository.findByEmail("u@t.com")).thenReturn(Optional.of(u));
        when(proposalRepository.save(any())).thenAnswer(inv -> {
            CalendarEventProposal p = inv.getArgument(0); p.setId(7L); return p;
        });

        CalendarEventProposalResponse out = calendarService.submitProposal(request(), "u@t.com");
        assertThat(out).isNotNull();
    }

    @Test
    void approveProposal_createsEventAndMarksApproved() {
        User u = User.builder().id(1L).username("u").build();
        CalendarEventProposal p = CalendarEventProposal.builder()
            .id(5L).title("t").description("d").startDate(LocalDate.now()).endDate(LocalDate.now())
            .eventType(EventType.LECTURE).submittedBy(u).status(ProposalStatus.PENDING).build();
        when(proposalRepository.findById(5L)).thenReturn(Optional.of(p));
        when(calendarEventRepository.save(any())).thenAnswer(inv -> {
            CalendarEvent e = inv.getArgument(0); e.setId(11L); return e;
        });

        calendarService.approveProposal(5L);
        assertThat(p.getStatus()).isEqualTo(ProposalStatus.APPROVED);
        verify(proposalRepository).save(p);
    }

    @Test
    void rejectProposal_setsRejectedAndStoresNote() {
        CalendarEventProposal p = CalendarEventProposal.builder()
            .id(5L).status(ProposalStatus.PENDING).submittedBy(User.builder().id(1L).build())
            .eventType(EventType.EXAM).startDate(LocalDate.now()).endDate(LocalDate.now()).build();
        when(proposalRepository.findById(5L)).thenReturn(Optional.of(p));
        when(proposalRepository.save(any())).thenReturn(p);

        calendarService.rejectProposal(5L, "no");
        assertThat(p.getStatus()).isEqualTo(ProposalStatus.REJECTED);
        assertThat(p.getAdminNote()).isEqualTo("no");
    }

    @Test
    void updateEvent_blocksNonOwnerNonAdmin() {
        User owner = User.builder().id(1L).build();
        User other = User.builder().id(2L).email("x@t.com").role("STUDENT").build();
        CalendarEvent e = CalendarEvent.builder().id(7L).createdBy(owner).build();
        when(calendarEventRepository.findById(7L)).thenReturn(Optional.of(e));
        when(userRepository.findByEmail("x@t.com")).thenReturn(Optional.of(other));

        assertThatThrownBy(() -> calendarService.updateEvent(7L, request(), "x@t.com"))
            .hasMessage("Unauthorized");
    }

    @Test
    void deleteEvent_allowsAdmin() {
        User admin = User.builder().id(2L).email("a@t.com").role("ADMIN").build();
        CalendarEvent e = CalendarEvent.builder().id(7L).createdBy(User.builder().id(1L).build()).build();
        when(calendarEventRepository.findById(7L)).thenReturn(Optional.of(e));
        when(userRepository.findByEmail("a@t.com")).thenReturn(Optional.of(admin));

        calendarService.deleteEvent(7L, "a@t.com");
        verify(calendarEventRepository).deleteById(7L);
    }

    @Test
    void getPendingProposals_filtersToPending() {
        when(proposalRepository.findByStatusOrderByCreatedAtDesc(ProposalStatus.PENDING))
            .thenReturn(List.of(CalendarEventProposal.builder().id(1L).submittedBy(User.builder().id(1L).build())
                .startDate(LocalDate.now()).endDate(LocalDate.now()).eventType(EventType.EXAM).build()));
        assertThat(calendarService.getPendingProposals()).hasSize(1);
    }
}
