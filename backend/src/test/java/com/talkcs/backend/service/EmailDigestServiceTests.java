package com.talkcs.backend.service;

import com.talkcs.backend.model.Notification;
import com.talkcs.backend.model.User;
import com.talkcs.backend.repository.NotificationRepository;
import com.talkcs.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailDigestServiceTests {

    @Mock private UserRepository userRepository;
    @Mock private NotificationRepository notificationRepository;
    @Mock private EmailService emailService;
    @InjectMocks private EmailDigestService emailDigestService;

    @Test
    void sendDailyDigests_skipsUsersWithoutNotifications() {
        User optIn = User.builder().id(1L).email("a@t.com").username("a").emailNotificationsEnabled(true).build();
        when(userRepository.findAll()).thenReturn(List.of(optIn));
        when(notificationRepository.findByRecipientIdOrderByCreatedAtDesc(1L)).thenReturn(List.of());

        emailDigestService.sendDailyDigests();

        verify(emailService, never()).sendNotificationEmail(any(), any(), any());
    }

    @Test
    void sendDailyDigests_sendsForUsersWithRecentUnread() {
        User u = User.builder().id(1L).email("a@t.com").username("a").emailNotificationsEnabled(true).build();
        Notification n = Notification.builder().message("x").createdAt(LocalDateTime.now().minusHours(1))
            .recipient(u).build();
        when(userRepository.findAll()).thenReturn(List.of(u));
        when(notificationRepository.findByRecipientIdOrderByCreatedAtDesc(1L)).thenReturn(List.of(n));
        when(emailService.buildDigestHtml(any())).thenReturn("<html/>");

        emailDigestService.sendDailyDigests();

        verify(emailService).sendNotificationEmail(eq(u), any(), eq("<html/>"));
    }

    @Test
    void sendDailyDigests_skipsOptedOut() {
        User u = User.builder().id(1L).emailNotificationsEnabled(false).build();
        when(userRepository.findAll()).thenReturn(List.of(u));

        emailDigestService.sendDailyDigests();
        verify(emailService, never()).sendNotificationEmail(any(), any(), any());
    }
}
