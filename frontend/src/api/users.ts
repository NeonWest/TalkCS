import api from './api';
import type { Post } from './posts';

export interface UserProfile {
    id: number;
    username: string;
    createdAt: string;
    role: string;
    postCount: number;
}

export const getUserProfile = async (username: string): Promise<UserProfile> => {
    return (await api.get<UserProfile>(`/api/users/${username}`)).data;
};

export const getUserPosts = async (username: string): Promise<Post[]> => {
    return (await api.get<Post[]>(`/api/users/${username}/posts`)).data;
};