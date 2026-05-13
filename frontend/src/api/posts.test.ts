import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    getPosts, createPost, getPostById, updatePost, deletePost,
    setPostStatus, acceptAnswer, unacceptAnswer,
    bookmarkPost, unbookmarkPost, getTrendingPosts, getSimilarPosts,
} from './posts';
import api from './api';

vi.mock('./api', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
    },
}));

const mockGet = api.get as ReturnType<typeof vi.fn>;
const mockPost = api.post as ReturnType<typeof vi.fn>;
const mockPut = api.put as ReturnType<typeof vi.fn>;
const mockDelete = api.delete as ReturnType<typeof vi.fn>;

describe('posts API', () => {
    beforeEach(() => vi.clearAllMocks());

    it('getPosts encodes optional categoryId', async () => {
        mockGet.mockResolvedValue({ data: { posts: [], totalItems: 0 } });
        await getPosts(5, 1, 20, 'votes');
        expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('categoryId=5'));
        expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('sortBy=votes'));
    });

    it('getPosts omits categoryId when undefined', async () => {
        mockGet.mockResolvedValue({ data: { posts: [] } });
        await getPosts();
        expect(mockGet).toHaveBeenCalledWith(expect.not.stringContaining('categoryId'));
    });

    it('createPost posts payload', async () => {
        mockPost.mockResolvedValue({ data: { id: 1 } });
        await createPost({ title: 't', body: 'b', categoryId: 1 });
        expect(mockPost).toHaveBeenCalledWith('/api/posts', expect.objectContaining({ title: 't' }));
    });

    it('getPostById fetches by id', async () => {
        mockGet.mockResolvedValue({ data: { id: 5 } });
        const p = await getPostById(5);
        expect(p.id).toBe(5);
        expect(mockGet).toHaveBeenCalledWith('/api/posts/5');
    });

    it('updatePost puts to /api/posts/:id', async () => {
        mockPut.mockResolvedValue({ data: {} });
        await updatePost(1, { title: 'x', body: 'y', categoryId: 1 });
        expect(mockPut).toHaveBeenCalledWith('/api/posts/1', expect.any(Object));
    });

    it('deletePost calls DELETE', async () => {
        mockDelete.mockResolvedValue({});
        await deletePost(1);
        expect(mockDelete).toHaveBeenCalledWith('/api/posts/1');
    });

    it('setPostStatus sends status payload', async () => {
        mockPut.mockResolvedValue({ data: {} });
        await setPostStatus(1, 'CLOSED');
        expect(mockPut).toHaveBeenCalledWith('/api/posts/1/status', { status: 'CLOSED' });
    });

    it('acceptAnswer + unacceptAnswer route correctly', async () => {
        mockPut.mockResolvedValue({ data: {} });
        mockDelete.mockResolvedValue({ data: {} });
        await acceptAnswer(1, 5);
        expect(mockPut).toHaveBeenCalledWith('/api/posts/1/accept/5');
        await unacceptAnswer(1);
        expect(mockDelete).toHaveBeenCalledWith('/api/posts/1/accept');
    });

    it('bookmark + unbookmark hit correct endpoints', async () => {
        mockPost.mockResolvedValue({ data: {} });
        mockDelete.mockResolvedValue({});
        await bookmarkPost(1);
        expect(mockPost).toHaveBeenCalledWith('/api/posts/1/bookmark');
        await unbookmarkPost(1);
        expect(mockDelete).toHaveBeenCalledWith('/api/posts/1/bookmark');
    });

    it('getTrendingPosts uses limit param', async () => {
        mockGet.mockResolvedValue({ data: [] });
        await getTrendingPosts(7);
        expect(mockGet).toHaveBeenCalledWith('/api/posts/trending?limit=7');
    });

    it('getSimilarPosts encodes tags as repeated params', async () => {
        mockGet.mockResolvedValue({ data: [] });
        await getSimilarPosts('t', 'b', 1, ['java', 'spring']);
        const url = mockGet.mock.calls[0][0];
        expect(url).toContain('tags=java');
        expect(url).toContain('tags=spring');
    });
});
