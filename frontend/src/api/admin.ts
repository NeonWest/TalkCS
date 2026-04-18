import api from './api';

export interface AdminStats {
    totalUsers: number;
    totalPosts: number;
    totalComments: number;
    totalResources: number;
    postsThisWeek: number;
    newUsersThisWeek: number;
    mostActiveCategories: { categoryId: number; categoryName: string; postCount: number }[];
}

export interface UserAdmin {
    id: number;
    username: string;
    email: string;
    role: string;
    reputation: number;
    createdAt: string;
    postCount: number;
    commentCount: number;
}

export interface SiteConfig {
    id: number;
    siteName: string;
    siteTagline: string;
    primaryColor: string;
    logoUrl: string | null;
}

export const getAdminStats = async (): Promise<AdminStats> =>
    (await api.get<AdminStats>('/api/admin/stats')).data;

export const getAdminUsers = async (page: number, search?: string): Promise<{ content: UserAdmin[]; totalPages: number; totalElements: number }> =>
    (await api.get('/api/admin/users', { params: { page, search } })).data;

export const toggleUserRole = async (id: number): Promise<UserAdmin> =>
    (await api.put<UserAdmin>(`/api/admin/users/${id}/role`)).data;

export const deleteAdminUser = async (id: number): Promise<void> =>
    api.delete(`/api/admin/users/${id}`);

export const getSiteConfig = async (): Promise<SiteConfig> =>
    (await api.get<SiteConfig>('/api/admin/config')).data;

export const updateSiteConfig = async (config: Partial<SiteConfig>): Promise<SiteConfig> =>
    (await api.put<SiteConfig>('/api/admin/config', config)).data;
