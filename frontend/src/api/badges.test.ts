import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUserBadges } from './badges';
import api from './api';

vi.mock('./api', () => ({
    default: { get: vi.fn() },
}));

const mockGet = api.get as ReturnType<typeof vi.fn>;

describe('badges API', () => {
    beforeEach(() => vi.clearAllMocks());

    it('getUserBadges fetches by username', async () => {
        mockGet.mockResolvedValue({ data: [] });
        await getUserBadges('alice');
        expect(mockGet).toHaveBeenCalledWith('/api/users/alice/badges');
    });
});
