import api from './api';

export interface ChatConversation {
    id: number;
    otherUsername: string;
    lastMessage: string | null;
    lastMessageAt: string | null;
    unreadCount: number;
}

export interface ChatMessage {
    id: number;
    conversationId: number;
    senderUsername: string;
    content: string;
    sentAt: string;
    isRead: boolean;
}

export const getConversations = async (): Promise<ChatConversation[]> => {
    const res = await api.get<ChatConversation[]>('/api/chat/conversations');
    return res.data;
};

export const openConversation = async (username: string): Promise<ChatConversation> => {
    const res = await api.post<ChatConversation>(`/api/chat/conversations/open/${username}`);
    return res.data;
};

export const getMessages = async (conversationId: number): Promise<ChatMessage[]> => {
    const res = await api.get<ChatMessage[]>(`/api/chat/conversations/${conversationId}/messages`);
    return res.data;
};

export const getUnreadChatCount = async (): Promise<number> => {
    const res = await api.get<{ count: number }>('/api/chat/unread-count');
    return res.data.count;
};
