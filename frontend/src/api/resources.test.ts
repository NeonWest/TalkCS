import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getResources, getTrendingResources, deleteResource, voteOnResource, uploadResource } from './resources';
import api from './api';

vi.mock('./api', () => ({
    default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

const mockGet = api.get as ReturnType<typeof vi.fn>;
const mockPost = api.post as ReturnType<typeof vi.fn>;
const mockDelete = api.delete as ReturnType<typeof vi.fn>;

describe('resources API', () => {
    beforeEach(() => vi.clearAllMocks());

    it('getResources passes categoryId', async () => {
        mockGet.mockResolvedValue({ data: [] });
        await getResources(3);
        expect(mockGet).toHaveBeenCalledWith('/api/resources?categoryId=3');
    });

    it('getTrendingResources passes limit', async () => {
        mockGet.mockResolvedValue({ data: [] });
        await getTrendingResources(7);
        expect(mockGet).toHaveBeenCalledWith('/api/resources/trending?limit=7');
    });

    it('deleteResource hits id', async () => {
        mockDelete.mockResolvedValue({});
        await deleteResource(5);
        expect(mockDelete).toHaveBeenCalledWith('/api/resources/5');
    });

    it('voteOnResource posts value', async () => {
        mockPost.mockResolvedValue({});
        await voteOnResource(2, 1);
        expect(mockPost).toHaveBeenCalledWith('/api/votes/resource/2', { value: 1 });
    });

    it('uploadResource builds multipart form', async () => {
        mockPost.mockResolvedValue({ data: {} });
        const file = new File(['x'], 'note.pdf', { type: 'application/pdf' });
        await uploadResource(file, 'T', 'D', 1);
        expect(mockPost).toHaveBeenCalledWith(
            '/api/resources',
            expect.any(FormData),
            expect.objectContaining({ headers: { 'Content-Type': 'multipart/form-data' } })
        );
    });
});
