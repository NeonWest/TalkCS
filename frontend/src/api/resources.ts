import api from './api';

export interface ResourceItem {
    id: number;
    title: string;
    description: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    createdAt: string;
    uploaderUsername: string;
    voteScore: number;
    userVote: number;
}

export const getResources = async (categoryId: number): Promise<ResourceItem[]> => {
    return (await api.get<ResourceItem[]>(`/api/resources?categoryId=${categoryId}`)).data;
};

export const uploadResource = async (
    file: File,
    title: string,
    description: string,
    categoryId: number
): Promise<ResourceItem> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('categoryId', String(categoryId));

    return (
        await api.post<ResourceItem>('/api/resources', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
    ).data;
};

export const deleteResource = async (id: number): Promise<void> => {
    await api.delete(`/api/resources/${id}`);
};

export const voteOnResource = async (id: number, value: 1 | -1): Promise<void> => {
    await api.post(`/api/votes/resource/${id}`, { value });
};
