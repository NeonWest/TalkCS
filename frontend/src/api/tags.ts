import api from './api';

export async function getAllTags(): Promise<string[]> {
    const res = await api.get<string[]>('/tags');
    return res.data;
}

export async function getPopularTags(): Promise<string[]> {
    const res = await api.get<string[]>('/tags/popular');
    return res.data;
}

export async function suggestTags(title: string, body: string): Promise<string[]> {
    const res = await api.post<string[]>('/api/tags/suggest', { title, body });
    return res.data;
}
