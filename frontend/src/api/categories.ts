import api from './api';

export interface Category {
    id: number;
    name: string;
    description: string;
    createdAt: string;
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
