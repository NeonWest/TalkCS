import { describe, it, expect, vi, beforeEach } from 'vitest';
import { search } from './search';
import api from './api';

vi.mock('./api', () => ({
    default: { get: vi.fn() },
}));

const mockGet = api.get as ReturnType<typeof vi.fn>;

describe('search API', () => {
    beforeEach(() => vi.clearAllMocks());

    it('encodes query string', async () => {
        mockGet.mockResolvedValue({ data: { posts: [], categories: [], users: [] } });
        await search('java spring');
        expect(mockGet).toHaveBeenCalledWith('/api/search?q=java%20spring');
    });
});
