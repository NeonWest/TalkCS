import api from './api';

export interface Post {
    id: number;
    title: string;
    body: string;
    createdAt: string;
    authorUsername: string;
    commentCount: number;
}

export interface PostRequest {
    title: string;
    body: string;
    categoryId: number;
}

export const getPosts = async (categoryId: number): Promise<Post[]> => {
    return (await api.get<Post[]>(`/api/posts?categoryId=${categoryId}`)).data;
};

export const createPost = async (data: PostRequest): Promise<Post> => {
    return (await api.post<Post>('/api/posts', data)).data;
};

export const getPostById = async (id: number): Promise<Post> => {
    return (await api.get<Post>(`/api/posts/${id}`)).data;
};
