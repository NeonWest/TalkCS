import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getComments, createComment, updateComment, deleteComment } from './comments';
import api from './api';

vi.mock('./api', () => ({
    default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

const mockGet = api.get as ReturnType<typeof vi.fn>;
const mockPost = api.post as ReturnType<typeof vi.fn>;
const mockPut = api.put as ReturnType<typeof vi.fn>;
const mockDelete = api.delete as ReturnType<typeof vi.fn>;

describe('comments API', () => {
    beforeEach(() => vi.clearAllMocks());

    it('getComments paginates', async () => {
        mockGet.mockResolvedValue({ data: { comments: [], totalItems: 0 } });
        await getComments(1, 2, 30);
        expect(mockGet).toHaveBeenCalledWith('/api/comments?postId=1&page=2&size=30');
    });

    it('createComment posts payload', async () => {
        mockPost.mockResolvedValue({ data: { id: 1 } });
        await createComment({ postId: 1, body: 'hi' });
        expect(mockPost).toHaveBeenCalledWith('/api/comments', { postId: 1, body: 'hi' });
    });

    it('updateComment puts to id', async () => {
        mockPut.mockResolvedValue({ data: {} });
        await updateComment(5, { postId: 1, body: 'edit' });
        expect(mockPut).toHaveBeenCalledWith('/api/comments/5', expect.any(Object));
    });

    it('deleteComment removes by id', async () => {
        mockDelete.mockResolvedValue({});
        await deleteComment(5);
        expect(mockDelete).toHaveBeenCalledWith('/api/comments/5');
    });
});
