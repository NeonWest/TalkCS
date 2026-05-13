package com.talkcs.backend.service;

import com.talkcs.backend.model.ChatConversation;
import com.talkcs.backend.model.ChatMessage;
import com.talkcs.backend.model.User;
import com.talkcs.backend.repository.ChatConversationRepository;
import com.talkcs.backend.repository.ChatMessageRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChatServiceTests {

    @Mock private ChatConversationRepository convRepo;
    @Mock private ChatMessageRepository msgRepo;
    @Mock private SimpMessagingTemplate messagingTemplate;
    @InjectMocks private ChatService chatService;

    private User u(long id) { return User.builder().id(id).username("u" + id).build(); }

    @Test
    void getOrCreate_normalizesUserOrder() {
        User me = u(2L), other = u(1L);
        when(convRepo.findByUserAAndUserB(other, me)).thenReturn(Optional.empty());
        when(convRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        ChatConversation c = chatService.getOrCreate(me, other);
        assertThat(c.getUserA().getId()).isEqualTo(1L);
        assertThat(c.getUserB().getId()).isEqualTo(2L);
    }

    @Test
    void getOrCreate_reusesExisting() {
        User me = u(1L), other = u(2L);
        ChatConversation existing = ChatConversation.builder().id(99L).userA(me).userB(other).build();
        when(convRepo.findByUserAAndUserB(me, other)).thenReturn(Optional.of(existing));

        ChatConversation c = chatService.getOrCreate(me, other);
        assertThat(c.getId()).isEqualTo(99L);
        verify(convRepo, never()).save(any());
    }

    @Test
    void sendMessage_persistsAndBroadcasts() {
        User sender = u(1L), recipient = u(2L);
        ChatConversation conv = ChatConversation.builder().id(10L).userA(sender).userB(recipient).build();
        when(convRepo.findById(10L)).thenReturn(Optional.of(conv));
        when(msgRepo.save(any(ChatMessage.class))).thenAnswer(inv -> {
            ChatMessage m = inv.getArgument(0); m.setId(50L); return m;
        });

        chatService.sendMessage(10L, sender, "hi");

        ArgumentCaptor<ChatMessage> cap = ArgumentCaptor.forClass(ChatMessage.class);
        verify(msgRepo).save(cap.capture());
        assertThat(cap.getValue().getRecipient().getId()).isEqualTo(2L);
        verify(messagingTemplate).convertAndSend(eq("/topic/user/2/messages"), any(Object.class));
        verify(messagingTemplate).convertAndSend(eq("/topic/user/1/messages"), any(Object.class));
    }

    @Test
    void sendMessage_throwsForNonMember() {
        User sender = u(99L);
        ChatConversation conv = ChatConversation.builder().id(10L).userA(u(1L)).userB(u(2L)).build();
        when(convRepo.findById(10L)).thenReturn(Optional.of(conv));

        assertThatThrownBy(() -> chatService.sendMessage(10L, sender, "hi"))
            .hasMessage("Not a participant");
    }

    @Test
    void getMessages_delegatesToRepo() {
        when(msgRepo.findByConversationIdOrderBySentAtAsc(5L)).thenReturn(List.of());
        assertThat(chatService.getMessages(5L)).isEmpty();
    }

    @Test
    void getUnreadCount_returnsRepoCount() {
        User me = u(1L);
        when(msgRepo.countByRecipientIdAndIsReadFalse(1L)).thenReturn(7L);
        assertThat(chatService.getUnreadCount(me)).isEqualTo(7L);
    }

    @Test
    void markRead_callsRepo() {
        chatService.markRead(5L, u(1L));
        verify(msgRepo).markReadForConversation(5L, 1L);
    }
}
