package com.talkcs.backend.controller;

import com.talkcs.backend.dto.ChatConversationResponse;
import com.talkcs.backend.dto.ChatMessageResponse;
import com.talkcs.backend.dto.ChatSendRequest;
import com.talkcs.backend.model.User;
import com.talkcs.backend.repository.UserRepository;
import com.talkcs.backend.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final UserRepository userRepository;

    @GetMapping("/conversations")
    public ResponseEntity<List<ChatConversationResponse>> getConversations() {
        return ResponseEntity.ok(chatService.getConversations(currentUser()));
    }

    @PostMapping("/conversations/open/{username}")
    public ResponseEntity<ChatConversationResponse> openConversation(@PathVariable String username) {
        User me = currentUser();
        User other = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        var conv = chatService.getOrCreate(me, other);
        List<ChatConversationResponse> all = chatService.getConversations(me);
        return all.stream().filter(c -> c.getId().equals(conv.getId()))
                .findFirst()
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.ok(ChatConversationResponse.builder()
                        .id(conv.getId()).otherUsername(other.getUsername()).unreadCount(0).build()));
    }

    @GetMapping("/conversations/{id}/messages")
    public ResponseEntity<List<ChatMessageResponse>> getMessages(@PathVariable Long id) {
        User me = currentUser();
        List<ChatMessageResponse> messages = chatService.getMessages(id);
        chatService.markRead(id, me);
        return ResponseEntity.ok(messages);
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount() {
        return ResponseEntity.ok(Map.of("count", chatService.getUnreadCount(currentUser())));
    }

    @MessageMapping("/chat.send")
    public void send(@Payload ChatSendRequest req, Principal principal) {
        User sender = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        chatService.sendMessage(req.conversationId(), sender, req.content());
    }

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
    }
}
