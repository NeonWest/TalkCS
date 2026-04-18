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