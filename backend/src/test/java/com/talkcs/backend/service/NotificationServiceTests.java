package com.talkcs.backend.service;

import com.talkcs.backend.dto.NotificationResponse;
import com.talkcs.backend.model.Notification;
import com.talkcs.backend.model.Notification.NotificationType;
import com.talkcs.backend.model.User;
import com.talkcs.backend.repository.NotificationRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTests {

    @Mock private NotificationRepository notificationRepository;
    @Mock private EmailService emailService;
    @InjectMocks private NotificationService notificationService;

    @Test
    void notify_persistsAndSendsEmailForMention() {
        User u = User.builder().id(1L).email("u@t.com").username("u").build();
        when(emailService.buildNotificationHtml(any(), any())).thenReturn("<html/>");

        notificationService.notify(u, NotificationType.MENTION, "msg", "/x");

        ArgumentCaptor<Notification> cap = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(cap.capture());
        assertThat(cap.getValue().getType()).isEqualTo(NotificationType.MENTION);
        verify(emailService).sendNotificationEmail(eq(u), contains("mentioned"), eq("<html/>"));
    }

    @Test
    void notify_skipsEmailForNonEmailableTypes() {
        User u = User.builder().id(1L).email("u@t.com").build();

        notificationService.notify(u, NotificationType.FOLLOW, "m", "/y");

        verify(notificationRepository).save(any());
        verify(emailService, never()).sendNotificationEmail(any(), any(), any());
    }

    @Test
    void notify_sendsEmailForAcceptedAnswer() {
        User u = User.builder().id(1L).email("u@t.com").build();
        when(emailService.buildNotificationHtml(any(), any())).thenReturn("<h/>");

        notificationService.notify(u, NotificationType.ACCEPTED_ANSWER, "m", "/p");

        verify(emailService).sendNotificationEmail(eq(u), contains("accepted"), eq("<h/>"));
    }

    @Test
    void getForUser_mapsAllNotifications() {
        Notification n = Notification.builder().id(1L).type(NotificationType.REPLY).message("x").link("/p").build();
        when(notificationRepository.findByRecipientIdOrderByCreatedAtDesc(5L)).thenReturn(List.of(n));

        List<NotificationResponse> out = notificationService.getForUser(5L);
        assertThat(out).hasSize(1);
        assertThat(out.get(0).getMessage()).isEqualTo("x");
    }

    @Test
    void countUnread_delegatesToRepo() {
        when(notificationRepository.countByRecipientIdAndIsReadFalse(7L)).thenReturn(3L);
        assertThat(notificationService.countUnread(7L)).isEqualTo(3L);
    }

    @Test
    void markRead_marksAndSavesWhenFound() {
        Notification n = Notification.builder().id(9L).build();
        when(notificationRepository.findById(9L)).thenReturn(Optional.of(n));

        notificationService.markRead(9L);

        assertThat(n.isRead()).isTrue();
        verify(notificationRepository).save(n);
    }

    @Test
    void markRead_noopWhenMissing() {
        when(notificationRepository.findById(99L)).thenReturn(Optional.empty());
        notificationService.markRead(99L);
        verify(notificationRepository, never()).save(any());
    }

    @Test
    void markAllRead_callsBulkUpdate() {
        notificationService.markAllRead(4L);
        verify(notificationRepository).markAllReadByUserId(4L);
    }
}
