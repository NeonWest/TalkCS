import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    getCategories, createCategory, getCategoryById,
    updateCategory, deleteCategory, restoreCategory, getAllCategoriesAdmin,
} from './categories';
import api from './api';

vi.mock('./api', () => ({
    default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

const mockGet = api.get as ReturnType<typeof vi.fn>;
const mockPost = api.post as ReturnType<typeof vi.fn>;
const mockPut = api.put as ReturnType<typeof vi.fn>;
const mockDelete = api.delete as ReturnType<typeof vi.fn>;

describe('categories API', () => {
    beforeEach(() => vi.clearAllMocks());

    it('getCategories fetches list', async () => {
        mockGet.mockResolvedValue({ data: [] });
        await getCategories();
        expect(mockGet).toHaveBeenCalledWith('/api/categories');
    });

    it('createCategory posts payload', async () => {
        mockPost.mockResolvedValue({ data: {} });
        await createCategory({ name: 'X', description: 'd' });
        expect(mockPost).toHaveBeenCalledWith('/api/categories', { name: 'X', description: 'd' });
    });

    it('getCategoryById fetches by id', async () => {
        mockGet.mockResolvedValue({ data: {} });
        await getCategoryById(5);
        expect(mockGet).toHaveBeenCalledWith('/api/categories/5');
    });

    it('updateCategory + deleteCategory + restoreCategory hit right URLs', async () => {
        mockPut.mockResolvedValue({ data: {} });
        mockDelete.mockResolvedValue({});
        await updateCategory(1, { name: 'N', description: 'd' });
        expect(mockPut).toHaveBeenCalledWith('/api/categories/1', expect.any(Object));
        await deleteCategory(1);
        expect(mockDelete).toHaveBeenCalledWith('/api/categories/1');
        await restoreCategory(1);
        expect(mockPut).toHaveBeenCalledWith('/api/categories/1/restore');
    });

    it('getAllCategoriesAdmin hits admin endpoint', async () => {
        mockGet.mockResolvedValue({ data: [] });
        await getAllCategoriesAdmin();
        expect(mockGet).toHaveBeenCalledWith('/api/categories/admin/all');
    });
});
