import api from './api';

export interface NotificationItem {
    id: number;
    type: 'MENTION' | 'REPLY' | 'VOTE_MILESTONE' | 'ACCEPTED_ANSWER' | 'FOLLOW';
    message: string;
    link: string;
    isRead: boolean;
    createdAt: string;
}

export const getNotifications = async (): Promise<NotificationItem[]> =>
    (await api.get<NotificationItem[]>('/api/notifications')).data;

export const getUnreadCount = async (): Promise<number> =>
    (await api.get<{ count: number }>('/api/notifications/count')).data.count;

export const markRead = async (id: number): Promise<void> =>
    void (await api.put(`/api/notifications/${id}/read`));

export const markAllRead = async (): Promise<void> =>
    void (await api.put('/api/notifications/read-all'));
