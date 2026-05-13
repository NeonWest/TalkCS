package com.talkcs.backend.repository;

import com.talkcs.backend.model.Notification;
import com.talkcs.backend.model.Notification.NotificationType;
import com.talkcs.backend.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
class NotificationRepositoryTests {

    @Autowired private NotificationRepository notificationRepository;
    @Autowired private UserRepository userRepository;

    private User u;

    @BeforeEach
    void setUp() {
        notificationRepository.deleteAll();
        userRepository.deleteAll();
        u = userRepository.save(User.builder().username("x").email("x@t.com").build());
    }

    @Test
    void countByRecipientIdAndIsReadFalse_excludesRead() {
        notificationRepository.save(Notification.builder().recipient(u).type(NotificationType.REPLY).message("a").isRead(false).createdAt(LocalDateTime.now()).build());
        notificationRepository.save(Notification.builder().recipient(u).type(NotificationType.REPLY).message("b").isRead(true).createdAt(LocalDateTime.now()).build());
        assertThat(notificationRepository.countByRecipientIdAndIsReadFalse(u.getId())).isEqualTo(1L);
    }

    @Test
    void markAllReadByUserId_marksAllUnread() {
        notificationRepository.save(Notification.builder().recipient(u).type(NotificationType.REPLY).message("a").isRead(false).createdAt(LocalDateTime.now()).build());
        notificationRepository.save(Notification.builder().recipient(u).type(NotificationType.REPLY).message("b").isRead(false).createdAt(LocalDateTime.now()).build());

        notificationRepository.markAllReadByUserId(u.getId());

        assertThat(notificationRepository.countByRecipientIdAndIsReadFalse(u.getId())).isZero();
    }

    @Test
    void findByRecipientIdOrderByCreatedAtDesc_returnsSorted() {
        notificationRepository.save(Notification.builder().recipient(u).type(NotificationType.REPLY).message("old").createdAt(LocalDateTime.now().minusDays(2)).build());
        notificationRepository.save(Notification.builder().recipient(u).type(NotificationType.REPLY).message("new").createdAt(LocalDateTime.now()).build());

        var list = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(u.getId());
        assertThat(list.get(0).getMessage()).isEqualTo("new");
    }
}
