package com.talkcs.backend.repository;

import com.talkcs.backend.model.CalendarEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface CalendarEventRepository extends JpaRepository<CalendarEvent, Long> {

    // Public events in date range (optionally filtered by category)
    @Query("SELECT e FROM CalendarEvent e WHERE e.publicEvent = true AND e.startDate BETWEEN :start AND :end ORDER BY e.startDate ASC")
    List<CalendarEvent> findPublicByDateRange(@Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("SELECT e FROM CalendarEvent e WHERE e.publicEvent = true AND e.category.id = :categoryId AND e.startDate BETWEEN :start AND :end ORDER BY e.startDate ASC")
    List<CalendarEvent> findPublicByCategoryAndDateRange(@Param("categoryId") Long categoryId, @Param("start") LocalDate start, @Param("end") LocalDate end);

    // Private events for a specific user in date range
    @Query("SELECT e FROM CalendarEvent e WHERE e.publicEvent = false AND e.createdBy.id = :userId AND e.startDate BETWEEN :start AND :end ORDER BY e.startDate ASC")
    List<CalendarEvent> findPrivateByUserAndDateRange(@Param("userId") Long userId, @Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("SELECT e FROM CalendarEvent e WHERE e.publicEvent = false AND e.createdBy.id = :userId AND e.category.id = :categoryId AND e.startDate BETWEEN :start AND :end ORDER BY e.startDate ASC")
    List<CalendarEvent> findPrivateByUserAndCategoryAndDateRange(@Param("userId") Long userId, @Param("categoryId") Long categoryId, @Param("start") LocalDate start, @Param("end") LocalDate end);

    // Upcoming public events
    @Query("SELECT e FROM CalendarEvent e WHERE e.publicEvent = true AND e.startDate >= :date ORDER BY e.startDate ASC")
    List<CalendarEvent> findUpcomingPublic(@Param("date") LocalDate date);

    @Query("SELECT e FROM CalendarEvent e WHERE e.publicEvent = true AND e.category.id = :categoryId AND e.startDate >= :date ORDER BY e.startDate ASC")
    List<CalendarEvent> findUpcomingPublicByCategory(@Param("categoryId") Long categoryId, @Param("date") LocalDate date);
}
