import api from './api';
import type { Post } from './posts';
import type { Category } from './categories';
import type { UserProfile } from './users';

export interface SearchResponse {
    posts: Post[];
    categories: Category[];
    users: UserProfile[];
}

export const search = async (q: string): Promise<SearchResponse> => {
    return (await api.get<SearchResponse>(`/api/search?q=${encodeURIComponent(q)}`)).data;
};
