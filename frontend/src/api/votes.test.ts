import { describe, it, expect, vi, beforeEach } from 'vitest';
import { voteOnPost, voteOnComment, getVoteErrorMessage } from './votes';
import api from './api';
import axios from 'axios';

vi.mock('./api', () => ({
    default: { post: vi.fn() },
}));

const mockPost = api.post as ReturnType<typeof vi.fn>;

describe('votes API', () => {
    beforeEach(() => vi.clearAllMocks());

    it('voteOnPost sends value', async () => {
        mockPost.mockResolvedValue({});
        await voteOnPost(1, 1);
        expect(mockPost).toHaveBeenCalledWith('/api/votes/post/1', { value: 1 });
    });

    it('voteOnComment sends value', async () => {
        mockPost.mockResolvedValue({});
        await voteOnComment(5, -1);
        expect(mockPost).toHaveBeenCalledWith('/api/votes/comment/5', { value: -1 });
    });

    it('getVoteErrorMessage returns server text from AxiosError', () => {
        const err = new axios.AxiosError('msg', undefined, undefined, undefined, {
            data: 'Cannot vote on your own post',
            status: 400, statusText: 'Bad Request', headers: {} as never, config: {} as never,
        });
        expect(getVoteErrorMessage(err)).toBe('Cannot vote on your own post');
    });

    it('getVoteErrorMessage falls back to default for non-axios', () => {
        expect(getVoteErrorMessage(new Error('x'))).toBe('Failed to submit vote.');
    });
});
