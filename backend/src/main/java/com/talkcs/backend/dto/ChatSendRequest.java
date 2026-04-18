package com.talkcs.backend.dto;

public record ChatSendRequest(Long conversationId, String content) {}
