package com.talkcs.backend.service;

import com.resend.Resend;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.model.CreateEmailOptions;
import com.talkcs.backend.model.User;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class EmailService {

    @Value("${resend.api-key}")
    private String apiKey;

    @Value("${app.mail.from}")
    private String from;

    @Value("${app.base-url}")
    private String baseUrl;

    private Resend resend;

    @PostConstruct
    void init() {
        resend = new Resend(apiKey);
    }

    public void sendNotificationEmail(User recipient, String subject, String htmlBody) {
        if (!recipient.isEmailNotificationsEnabled()) return;
        CreateEmailOptions options = CreateEmailOptions.builder()
                .from("TalkCS <" + from + ">")
                .to(recipient.getEmail())
                .subject(subject)
                .html(htmlBody)
                .build();
        try {
            resend.emails().send(options);
        } catch (ResendException e) {
            log.warn("Failed to send email to {}: {}", recipient.getEmail(), e.getMessage());
        }
    }

    public String buildNotificationHtml(String message, String link) {
        String fullLink = link != null ? baseUrl + link : baseUrl;
        return "<div style='font-family:sans-serif;max-width:600px'>"
                + "<h2 style='color:#ea580c'>TalkCS</h2>"
                + "<p>" + message + "</p>"
                + "<a href='" + fullLink + "' style='color:#ea580c'>View on TalkCS →</a>"
                + "</div>";
    }

    public String buildDigestHtml(java.util.List<com.talkcs.backend.model.Notification> notifications) {
        StringBuilder sb = new StringBuilder(
                "<div style='font-family:sans-serif;max-width:600px'>"
                + "<h2 style='color:#ea580c'>TalkCS — Your Daily Digest</h2>"
                + "<p>You have " + notifications.size() + " unread notification(s):</p><ul>");
        for (com.talkcs.backend.model.Notification n : notifications) {
            String fullLink = n.getLink() != null ? baseUrl + n.getLink() : baseUrl;
            sb.append("<li><a href='").append(fullLink).append("' style='color:#ea580c'>")
              .append(n.getMessage()).append("</a></li>");
        }
        sb.append("</ul></div>");
        return sb.toString();
    }
}
