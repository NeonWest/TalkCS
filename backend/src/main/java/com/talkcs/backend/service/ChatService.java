package com.talkcs.backend.service;

import com.talkcs.backend.dto.ChatConversationResponse;
import com.talkcs.backend.dto.ChatMessageResponse;
import com.talkcs.backend.model.ChatConversation;
import com.talkcs.backend.model.ChatMessage;
import com.talkcs.backend.model.User;
import com.talkcs.backend.repository.ChatConversationRepository;
import com.talkcs.backend.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatConversationRepository convRepo;
    private final ChatMessageRepository msgRepo;
    private final SimpMessagingTemplate messagingTemplate;

    public ChatConversation getOrCreate(User me, User other) {
        User a = me.getId() < other.getId() ? me : other;
        User b = me.getId() < other.getId() ? other : me;
        return convRepo.findByUserAAndUserB(a, b)
                .orElseGet(() -> convRepo.save(ChatConversation.builder()
                        .userA(a).userB(b).lastMessageAt(LocalDateTime.now()).build()));
    }

    public List<ChatConversationResponse> getConversations(User me) {
        return convRepo.findByUserAOrUserBOrderByLastMessageAtDesc(me, me).stream()
                .map(c -> toConvResponse(c, me))
                .toList();
    }

    public List<ChatMessageResponse> getMessages(Long conversationId) {
        return msgRepo.findByConversationIdOrderBySentAtAsc(conversationId).stream()
                .map(this::toMsgResponse)
                .toList();
    }

    public void markRead(Long conversationId, User reader) {
        msgRepo.markReadForConversation(conversationId, reader.getId());
    }

    public long getUnreadCount(User me) {
        return msgRepo.countByRecipientIdAndIsReadFalse(me.getId());
    }

    public void sendMessage(Long conversationId, User sender, String content) {
        ChatConversation conv = convRepo.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));

        boolean isMember = conv.getUserA().getId().equals(sender.getId())
                || conv.getUserB().getId().equals(sender.getId());
        if (!isMember) throw new RuntimeException("Not a participant");

        User recipient = conv.getUserA().getId().equals(sender.getId())
                ? conv.getUserB() : conv.getUserA();

        ChatMessage msg = msgRepo.save(ChatMessage.builder()
                .conversation(conv).sender(sender).recipient(recipient)
                .content(content).sentAt(LocalDateTime.now()).build());

        conv.setLastMessageAt(msg.getSentAt());
        convRepo.save(conv);

        ChatMessageResponse response = toMsgResponse(msg);
        messagingTemplate.convertAndSend("/topic/user/" + recipient.getId() + "/messages", response);
        messagingTemplate.convertAndSend("/topic/user/" + sender.getId() + "/messages", response);
    }

    private ChatConversationResponse toConvResponse(ChatConversation c, User me) {
        User other = c.getOtherUser(me);
        List<ChatMessage> msgs = msgRepo.findByConversationIdOrderBySentAtAsc(c.getId());
        String lastMsg = msgs.isEmpty() ? null : msgs.get(msgs.size() - 1).getContent();
        long unread = msgRepo.countByConversationIdAndRecipientIdAndIsReadFalse(c.getId(), me.getId());
        return ChatConversationResponse.builder()
                .id(c.getId()).otherUsername(other.getUsername())
                .lastMessage(lastMsg).lastMessageAt(c.getLastMessageAt())
                .unreadCount(unread).build();
    }

    private ChatMessageResponse toMsgResponse(ChatMessage m) {
        return ChatMessageResponse.builder()
                .id(m.getId()).conversationId(m.getConversation().getId())
                .senderUsername(m.getSender().getUsername())
                .content(m.getContent()).sentAt(m.getSentAt()).isRead(m.isRead()).build();
    }
}
