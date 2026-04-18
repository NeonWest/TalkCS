import api from './api';
import type { Post } from './posts';

export interface UserProfile {
    id: number;
    username: string;
    createdAt: string;
    role: string;
    postCount: number;
    commentCount: number;
    reputation: number;
    level: number;
    levelTitle: string;
    nextLevelRepRequired: number | null;
    followerCount: number;
    followingCount: number;
    followedByCurrentUser: boolean;
    bio: string | null;
    avatarUrl: string | null;
}

export const getUserProfile = async (username: string): Promise<UserProfile> => {
    return (await api.get<UserProfile>(`/api/users/${username}`)).data;
};

export const getUserPosts = async (username: string): Promise<Post[]> => {
    return (await api.get<Post[]>(`/api/users/${username}/posts`)).data;
};

export interface LeaderboardUser {
    id: number;
    username: string;
    reputation: number;
    level: number;
    levelTitle: string;
    role: string;
}

export const getLeaderboard = async (): Promise<LeaderboardUser[]> => {
    return (await api.get<LeaderboardUser[]>('/api/users/leaderboard')).data;
};

export const followUser = async (username: string): Promise<void> => {
    await api.post(`/api/users/${username}/follow`);
};

export const unfollowUser = async (username: string): Promise<void> => {
    await api.delete(`/api/users/${username}/follow`);
};

export const updateProfile = async (bio: string): Promise<UserProfile> => {
    return (await api.put<UserProfile>('/api/users/me', { bio })).data;
};

export const uploadAvatar = async (file: File): Promise<string> => {
    const form = new FormData();
    form.append('file', file);
    const res = await api.put<{ avatarUrl: string }>('/api/users/me/avatar', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.avatarUrl;
};