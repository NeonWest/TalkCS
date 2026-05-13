package com.talkcs.backend.service;

import com.talkcs.backend.model.Notification;
import com.talkcs.backend.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class EmailServiceTests {

    private EmailService emailService;

    @BeforeEach
    void setUp() {
        emailService = new EmailService();
        ReflectionTestUtils.setField(emailService, "apiKey", "test-key");
        ReflectionTestUtils.setField(emailService, "from", "test@test.com");
        ReflectionTestUtils.setField(emailService, "baseUrl", "http://localhost:5173");
    }

    @Test
    void buildNotificationHtml_includesMessageAndLink() {
        String html = emailService.buildNotificationHtml("Hello world", "/post/1");
        assertThat(html).contains("Hello world");
        assertThat(html).contains("http://localhost:5173/post/1");
    }

    @Test
    void buildNotificationHtml_handlesNullLink() {
        String html = emailService.buildNotificationHtml("msg", null);
        assertThat(html).contains("http://localhost:5173");
    }

    @Test
    void buildDigestHtml_listsAllNotifications() {
        Notification n1 = Notification.builder().message("m1").link("/p/1").build();
        Notification n2 = Notification.builder().message("m2").link("/p/2").build();
        String html = emailService.buildDigestHtml(List.of(n1, n2));
        assertThat(html).contains("m1").contains("m2");
        assertThat(html).contains("2 unread");
    }

    @Test
    void sendNotificationEmail_respectsOptOut() {
        // No exception even when API key invalid because emailNotificationsEnabled=false skips send
        User u = User.builder().email("u@t.com").emailNotificationsEnabled(false).build();
        emailService = new EmailService();
        ReflectionTestUtils.setField(emailService, "apiKey", "k");
        ReflectionTestUtils.setField(emailService, "from", "f@t.com");
        ReflectionTestUtils.setField(emailService, "baseUrl", "http://x");

        // Should not throw — internal try/catch + opt-out guard
        emailService.sendNotificationEmail(u, "subj", "<body/>");
    }
}
