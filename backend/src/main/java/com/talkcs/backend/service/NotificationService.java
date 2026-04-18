package com.talkcs.backend.service;

import com.talkcs.backend.dto.NotificationResponse;
import com.talkcs.backend.model.Notification;
import com.talkcs.backend.model.Notification.NotificationType;
import com.talkcs.backend.model.User;
import com.talkcs.backend.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {
    private final NotificationRepository notificationRepository;
    private final EmailService emailService;

    public void notify(User recipient, NotificationType type, String message, String link) {
        notificationRepository.save(Notification.builder()
            .recipient(recipient).type(type).message(message).link(link)
            .createdAt(LocalDateTime.now()).build());

        if (type == NotificationType.MENTION || type == NotificationType.ACCEPTED_ANSWER) {
            emailService.sendNotificationEmail(
                recipient,
                subjectFor(type),
                emailService.buildNotificationHtml(message, link)
            );
        }
    }

    private String subjectFor(NotificationType type) {
        return switch (type) {
            case MENTION -> "You were mentioned on TalkCS";
            case ACCEPTED_ANSWER -> "Your answer was accepted on TalkCS";
            default -> "New notification from TalkCS";
        };
    }

    public List<NotificationResponse> getForUser(Long userId) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId)
            .stream().map(this::toResponse).toList();
    }

    public long countUnread(Long userId) {
        return notificationRepository.countByRecipientIdAndIsReadFalse(userId);
    }

    public void markRead(Long notificationId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            n.setRead(true);
            notificationRepository.save(n);
        });
    }

    public void markAllRead(Long userId) {
        notificationRepository.markAllReadByUserId(userId);
    }

    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
            .id(n.getId()).type(n.getType()).message(n.getMessage())
            .link(n.getLink()).isRead(n.isRead()).createdAt(n.getCreatedAt())
            .build();
    }
}
