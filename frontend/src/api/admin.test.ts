import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAdminStats, getAdminUsers, setUserRole, deleteAdminUser, getSiteConfig, updateSiteConfig } from './admin';
import api from './api';

vi.mock('./api', () => ({
    default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

const mockGet = api.get as ReturnType<typeof vi.fn>;
const mockPut = api.put as ReturnType<typeof vi.fn>;
const mockDelete = api.delete as ReturnType<typeof vi.fn>;

describe('admin API', () => {
    beforeEach(() => vi.clearAllMocks());

    it('getAdminStats hits stats', async () => {
        mockGet.mockResolvedValue({ data: {} });
        await getAdminStats();
        expect(mockGet).toHaveBeenCalledWith('/api/admin/stats');
    });

    it('getAdminUsers passes pagination + search', async () => {
        mockGet.mockResolvedValue({ data: {} });
        await getAdminUsers(2, 'alice');
        expect(mockGet).toHaveBeenCalledWith('/api/admin/users', { params: { page: 2, search: 'alice' } });
    });

    it('setUserRole puts role payload', async () => {
        mockPut.mockResolvedValue({ data: {} });
        await setUserRole(1, 'ADMIN');
        expect(mockPut).toHaveBeenCalledWith('/api/admin/users/1/role', { role: 'ADMIN' });
    });

    it('deleteAdminUser hits user id', async () => {
        mockDelete.mockResolvedValue({});
        await deleteAdminUser(5);
        expect(mockDelete).toHaveBeenCalledWith('/api/admin/users/5');
    });

    it('getSiteConfig + updateSiteConfig hit config endpoint', async () => {
        mockGet.mockResolvedValue({ data: {} });
        mockPut.mockResolvedValue({ data: {} });
        await getSiteConfig();
        expect(mockGet).toHaveBeenCalledWith('/api/admin/config');
        await updateSiteConfig({ siteName: 'TalkCS' });
        expect(mockPut).toHaveBeenCalledWith('/api/admin/config', { siteName: 'TalkCS' });
    });
});
