package com.talkcs.backend.repository;

import com.talkcs.backend.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByConversationIdOrderBySentAtAsc(Long conversationId);
    long countByRecipientIdAndIsReadFalse(Long recipientId);
    long countByConversationIdAndRecipientIdAndIsReadFalse(Long conversationId, Long recipientId);

    @Modifying @Transactional
    @Query("UPDATE ChatMessage m SET m.isRead = true WHERE m.conversation.id = :convId AND m.recipient.id = :userId")
    void markReadForConversation(Long convId, Long userId);
}
