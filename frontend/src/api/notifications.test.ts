import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getNotifications, getUnreadCount, markRead, markAllRead } from './notifications';
import api from './api';

vi.mock('./api', () => ({
    default: { get: vi.fn(), put: vi.fn() },
}));

const mockGet = api.get as ReturnType<typeof vi.fn>;
const mockPut = api.put as ReturnType<typeof vi.fn>;

describe('notifications API', () => {
    beforeEach(() => vi.clearAllMocks());

    it('getNotifications hits endpoint', async () => {
        mockGet.mockResolvedValue({ data: [] });
        await getNotifications();
        expect(mockGet).toHaveBeenCalledWith('/api/notifications');
    });

    it('getUnreadCount extracts count', async () => {
        mockGet.mockResolvedValue({ data: { count: 5 } });
        const out = await getUnreadCount();
        expect(out).toBe(5);
    });

    it('markRead and markAllRead hit right URLs', async () => {
        mockPut.mockResolvedValue({});
        await markRead(7);
        expect(mockPut).toHaveBeenCalledWith('/api/notifications/7/read');
        await markAllRead();
        expect(mockPut).toHaveBeenCalledWith('/api/notifications/read-all');
    });
});
