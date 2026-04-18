import api from './api';

export interface Badge {
    id: number;
    name: string;
    description: string;
    iconKey: string;
    type: 'MILESTONE' | 'SPECIAL';
    awardedAt: string;
}

export const getUserBadges = async (username: string): Promise<Badge[]> => {
    return (await api.get<Badge[]>(`/api/users/${username}/badges`)).data;
};
