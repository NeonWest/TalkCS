package com.talkcs.backend.security;

import com.talkcs.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final JwtUtils jwtUtils;
    private final UserRepository userRepository;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) return message;

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            log.info("WebSocket CONNECT command received");
            String authHeader = accessor.getFirstNativeHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                if (jwtUtils.validateToken(token)) {
                    String email = jwtUtils.getUserNameFromToken(token);
                    userRepository.findByEmail(email).ifPresent(user -> {
                        log.info("Setting principal for WebSocket session: {}", user.getEmail());
                        accessor.setUser(new UsernamePasswordAuthenticationToken(
                                user.getEmail(), null, List.of()));
                    });
                }
            }
        } else if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
            String destination = accessor.getDestination();
            if (destination != null && destination.startsWith("/topic/user/")) {
                // Extract ID from /topic/user/{id}/messages
                try {
                    String[] parts = destination.split("/");
                    if (parts.length >= 4) {
                        String targetUserId = parts[3];
                        String userEmail = accessor.getUser() != null ? accessor.getUser().getName() : null;
                        
                        if (userEmail != null) {
                            boolean authorized = userRepository.findByEmail(userEmail)
                                    .map(user -> String.valueOf(user.getId()).equals(targetUserId))
                                    .orElse(false);
                            
                            if (!authorized) {
                                log.warn("Unauthorized subscription attempt by {} to {}", userEmail, destination);
                                throw new RuntimeException("Unauthorized subscription");
                            }
                            log.info("Authorized subscription for {} to {}", userEmail, destination);
                        } else {
                            throw new RuntimeException("Unauthenticated subscription attempt");
                        }
                    }
                } catch (Exception e) {
                    log.error("Subscription error: {}", e.getMessage());
                    return null; // Block the message
                }
            }
        }
        return message;
    }
}
