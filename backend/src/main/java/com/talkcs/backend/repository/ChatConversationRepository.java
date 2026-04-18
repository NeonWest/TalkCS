package com.talkcs.backend.repository;

import com.talkcs.backend.model.ChatConversation;
import com.talkcs.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ChatConversationRepository extends JpaRepository<ChatConversation, Long> {
    Optional<ChatConversation> findByUserAAndUserB(User userA, User userB);
    List<ChatConversation> findByUserAOrUserBOrderByLastMessageAtDesc(User userA, User userB);
}
