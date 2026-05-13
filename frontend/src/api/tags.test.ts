import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAllTags, getPopularTags, suggestTags } from './tags';
import api from './api';

vi.mock('./api', () => ({
    default: { get: vi.fn(), post: vi.fn() },
}));

const mockGet = api.get as ReturnType<typeof vi.fn>;
const mockPost = api.post as ReturnType<typeof vi.fn>;

describe('tags API', () => {
    beforeEach(() => vi.clearAllMocks());

    it('getAllTags fetches /tags', async () => {
        mockGet.mockResolvedValue({ data: [] });
        await getAllTags();
        expect(mockGet).toHaveBeenCalledWith('/tags');
    });

    it('getPopularTags fetches /tags/popular', async () => {
        mockGet.mockResolvedValue({ data: [] });
        await getPopularTags();
        expect(mockGet).toHaveBeenCalledWith('/tags/popular');
    });

    it('suggestTags posts payload', async () => {
        mockPost.mockResolvedValue({ data: [] });
        await suggestTags('t', 'b');
        expect(mockPost).toHaveBeenCalledWith('/api/tags/suggest', { title: 't', body: 'b' });
    });
});
