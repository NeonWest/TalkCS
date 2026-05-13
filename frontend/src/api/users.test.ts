import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    getUserProfile, getUserPosts, getLeaderboard, followUser,
    unfollowUser, updateProfile, searchUsers,
} from './users';
import api from './api';

vi.mock('./api', () => ({
    default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

const mockGet = api.get as ReturnType<typeof vi.fn>;
const mockPost = api.post as ReturnType<typeof vi.fn>;
const mockPut = api.put as ReturnType<typeof vi.fn>;
const mockDelete = api.delete as ReturnType<typeof vi.fn>;

describe('users API', () => {
    beforeEach(() => vi.clearAllMocks());

    it('getUserProfile fetches by username', async () => {
        mockGet.mockResolvedValue({ data: { username: 'alice' } });
        await getUserProfile('alice');
        expect(mockGet).toHaveBeenCalledWith('/api/users/alice');
    });

    it('getUserPosts fetches author posts', async () => {
        mockGet.mockResolvedValue({ data: [] });
        await getUserPosts('alice');
        expect(mockGet).toHaveBeenCalledWith('/api/users/alice/posts');
    });

    it('getLeaderboard hits leaderboard endpoint', async () => {
        mockGet.mockResolvedValue({ data: [] });
        await getLeaderboard();
        expect(mockGet).toHaveBeenCalledWith('/api/users/leaderboard');
    });

    it('followUser + unfollowUser hit correct endpoints', async () => {
        mockPost.mockResolvedValue({});
        mockDelete.mockResolvedValue({});
        await followUser('bob');
        expect(mockPost).toHaveBeenCalledWith('/api/users/bob/follow');
        await unfollowUser('bob');
        expect(mockDelete).toHaveBeenCalledWith('/api/users/bob/follow');
    });

    it('updateProfile sends bio', async () => {
        mockPut.mockResolvedValue({ data: { bio: 'hi' } });
        await updateProfile('hi');
        expect(mockPut).toHaveBeenCalledWith('/api/users/me', { bio: 'hi' });
    });

    it('searchUsers passes query', async () => {
        mockGet.mockResolvedValue({ data: [] });
        await searchUsers('foo');
        expect(mockGet).toHaveBeenCalledWith('/api/users/search?q=foo');
    });
});
