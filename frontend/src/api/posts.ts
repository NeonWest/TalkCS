import api from './api';

export type PostStatus = 'OPEN' | 'SOLVED' | 'CLOSED';

export interface Post {
    id: number;
    title: string;
    body: string;
    createdAt: string;
    authorUsername: string;
    commentCount: number;
    voteScore: number;
    userVote: number;
    tags?: string[];
    status?: PostStatus;
    acceptedAnswerId?: number | null;
}

export interface PostRequest {
    title: string;
    body: string;
    categoryId: number;
    tags?: string[];
}

export interface PaginatedPosts {
    posts: Post[];
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNext: boolean;
    hasPrevious: boolean;
}

export const getPosts = async (
    categoryId: number,
    page = 0,
    size = 10,
    sortBy = 'newest'
): Promise<PaginatedPosts> => {
    return (await api.get<PaginatedPosts>(`/api/posts?categoryId=${categoryId}&page=${page}&size=${size}&sortBy=${sortBy}`)).data;
};

export const createPost = async (data: PostRequest): Promise<Post> => {
    return (await api.post<Post>('/api/posts', data)).data;
};

export const getPostById = async (id: number): Promise<Post> => {
    return (await api.get<Post>(`/api/posts/${id}`)).data;
};

export const updatePost = async (id: number, data: PostRequest): Promise<Post> => {
    return (await api.put<Post>(`/api/posts/${id}`, data)).data;
};

export const deletePost = async (id: number): Promise<void> => {
    await api.delete(`/api/posts/${id}`);
};

export const setPostStatus = async (id: number, status: PostStatus): Promise<Post> => {
    return (await api.put<Post>(`/api/posts/${id}/status`, { status })).data;
};

export const acceptAnswer = async (postId: number, commentId: number): Promise<Post> => {
    return (await api.put<Post>(`/api/posts/${postId}/accept/${commentId}`)).data;
};
