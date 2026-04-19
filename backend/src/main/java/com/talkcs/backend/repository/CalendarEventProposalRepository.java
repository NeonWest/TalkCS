package com.talkcs.backend.repository;

import com.talkcs.backend.model.CalendarEventProposal;
import com.talkcs.backend.model.CalendarEventProposal.ProposalStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CalendarEventProposalRepository extends JpaRepository<CalendarEventProposal, Long> {
    List<CalendarEventProposal> findByStatusOrderByCreatedAtDesc(ProposalStatus status);
    List<CalendarEventProposal> findBySubmittedByIdOrderByCreatedAtDesc(Long userId);
}
