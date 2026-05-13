import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getConversations, openConversation, getMessages, getUnreadChatCount } from './chat';
import api from './api';

vi.mock('./api', () => ({
    default: { get: vi.fn(), post: vi.fn() },
}));

const mockGet = api.get as ReturnType<typeof vi.fn>;
const mockPost = api.post as ReturnType<typeof vi.fn>;

describe('chat API', () => {
    beforeEach(() => vi.clearAllMocks());

    it('getConversations fetches list', async () => {
        mockGet.mockResolvedValue({ data: [] });
        await getConversations();
        expect(mockGet).toHaveBeenCalledWith('/api/chat/conversations');
    });

    it('openConversation posts by username', async () => {
        mockPost.mockResolvedValue({ data: {} });
        await openConversation('alice');
        expect(mockPost).toHaveBeenCalledWith('/api/chat/conversations/open/alice');
    });

    it('getMessages fetches by conversation id', async () => {
        mockGet.mockResolvedValue({ data: [] });
        await getMessages(3);
        expect(mockGet).toHaveBeenCalledWith('/api/chat/conversations/3/messages');
    });

    it('getUnreadChatCount extracts count', async () => {
        mockGet.mockResolvedValue({ data: { count: 2 } });
        expect(await getUnreadChatCount()).toBe(2);
    });
});
