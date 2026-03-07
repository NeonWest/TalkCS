import api from './api';

export interface CommentResponse {
    id: number;
    body: string;
    createdAt: string;
    authorUsername: string;
    children: CommentResponse[];
}

export interface CommentRequest {
    body: string;
    postId: number;
    parentId?: number;
}

export const getComments = async (postId: number): Promise<CommentResponse[]> => {
    return (await api.get<CommentResponse[]>(`/api/comments?postId=${postId}`)).data;
};

export const createComment = async (data: CommentRequest): Promise<CommentResponse> => {
    return (await api.post<CommentResponse>('/api/comments', data)).data;
};
