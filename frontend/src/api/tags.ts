import api from './api';

export async function getAllTags(): Promise<string[]> {
    const res = await api.get<string[]>('/tags');
    return res.data;
}

export async function getPopularTags(): Promise<string[]> {
    const res = await api.get<string[]>('/tags/popular');
    return res.data;
}
