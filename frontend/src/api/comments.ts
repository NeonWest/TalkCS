import api from './api';

export interface CommentResponse {
    id: number;
    body: string;
    createdAt: string;
    authorUsername: string;
    voteScore: number;
    userVote: number;
    children: CommentResponse[];
    authorLevel?: string;
    authorRole?: string;
}

export interface CommentRequest {
    body: string;
    postId: number;
    parentId?: number;
}

export interface PaginatedComments {
    comments: CommentResponse[];
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNext: boolean;
    hasPrevious: boolean;
}

export const getComments = async (postId: number, page = 0, size = 10): Promise<PaginatedComments> => {
    return (await api.get<PaginatedComments>(`/api/comments?postId=${postId}&page=${page}&size=${size}`)).data;
};

export const createComment = async (data: CommentRequest): Promise<CommentResponse> => {
    return (await api.post<CommentResponse>('/api/comments', data)).data;
};

export const updateComment = async (id: number, data: CommentRequest): Promise<CommentResponse> => {
    return (await api.put<CommentResponse>(`/api/comments/${id}`, data)).data;
};

export const deleteComment = async (id: number): Promise<void> => {
    await api.delete(`/api/comments/${id}`);
};
