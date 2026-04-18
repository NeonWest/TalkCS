import api from './api';

export interface Category {
    id: number;
    name: string;
    description: string;
    createdAt: string;
    archived: boolean;
}

export interface CategoryRequest {
    name: string;
    description: string;
}

export const getCategories = async (): Promise<Category[]> => {
    const response = await api.get<Category[]>('/api/categories');
    return response.data;
};

export const createCategory = async (data: CategoryRequest): Promise<Category> => {
    const response = await api.post<Category>('/api/categories', data);
    return response.data;
};

export const getCategoryById = async (id: number): Promise<Category> => {
    const response = await api.get<Category>(`/api/categories/${id}`);
    return response.data;
};

export const updateCategory = async (id: number, data: CategoryRequest): Promise<Category> => {
    const response = await api.put<Category>(`/api/categories/${id}`, data);
    return response.data;
};

export const deleteCategory = async (id: number): Promise<void> => {
    await api.delete(`/api/categories/${id}`);
};

export const restoreCategory = async (id: number): Promise<Category> => {
    const response = await api.put<Category>(`/api/categories/${id}/restore`);
    return response.data;
};

export const getAllCategoriesAdmin = async (): Promise<Category[]> => {
    const response = await api.get<Category[]>('/api/categories/admin/all');
    return response.data;
};
