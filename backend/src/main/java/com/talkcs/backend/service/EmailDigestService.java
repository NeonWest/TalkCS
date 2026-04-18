package com.talkcs.backend.service;

import com.talkcs.backend.model.Notification;
import com.talkcs.backend.model.User;
import com.talkcs.backend.repository.NotificationRepository;
import com.talkcs.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailDigestService {

    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final EmailService emailService;

    @Scheduled(cron = "0 0 8 * * MON-FRI")
    public void sendDailyDigests() {
        LocalDateTime since = LocalDateTime.now().minusHours(24);
        userRepository.findAll().stream()
                .filter(User::isEmailNotificationsEnabled)
                .forEach(user -> sendDigestForUser(user, since));
    }

    private void sendDigestForUser(User user, LocalDateTime since) {
        List<Notification> unread = notificationRepository
                .findByRecipientIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .filter(n -> !n.isRead() && n.getCreatedAt().isAfter(since))
                .toList();

        if (unread.isEmpty()) return;

        log.info("Sending digest to {} ({} notifications)", user.getUsername(), unread.size());
        emailService.sendNotificationEmail(
                user,
                "TalkCS — Your Daily Digest",
                emailService.buildDigestHtml(unread)
        );
    }
}
