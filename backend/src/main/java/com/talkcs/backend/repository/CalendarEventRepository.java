package com.talkcs.backend.repository;

import com.talkcs.backend.model.CalendarEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface CalendarEventRepository extends JpaRepository<CalendarEvent, Long> {
    List<CalendarEvent> findByStartDateBetweenOrderByStartDateAsc(LocalDate start, LocalDate end);

    List<CalendarEvent> findByCategoryIdAndStartDateBetweenOrderByStartDateAsc(Long categoryId, LocalDate start, LocalDate end);

    List<CalendarEvent> findByCategoryIdAndStartDateGreaterThanEqualOrderByStartDateAsc(Long categoryId, LocalDate date);

    List<CalendarEvent> findByStartDateGreaterThanEqualOrderByStartDateAsc(LocalDate date);
}
