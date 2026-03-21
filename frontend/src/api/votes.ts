import axios from 'axios';
import api from './api';

export interface VoteRequest {
    value: 1 | -1;
}

export const getVoteErrorMessage = (error: unknown): string => {
    if (axios.isAxiosError(error)) {
        const data = error.response?.data;

        if (typeof data === 'string' && data.trim().length > 0) {
            return data;
        }
    }

    return 'Failed to submit vote.';
};

export const voteOnPost = async (postId: number, value: 1 | -1): Promise<void> => {
    await api.post(`/api/votes/post/${postId}`, { value } as VoteRequest);
};

export const voteOnComment = async (commentId: number, value: 1 | -1): Promise<void> => {
    await api.post(`/api/votes/comment/${commentId}`, { value } as VoteRequest);
};
