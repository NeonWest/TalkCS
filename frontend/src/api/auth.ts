import api from '../api/api';

export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface AuthResponse {
    token: string;
    username: string;
    email: string;
    role: string;
}

export const register = async (data: RegisterRequest): Promise<string> => {
    const response = await api.post<string>('/api/auth/register', data);
    return response.data;
};

export const login = async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/api/auth/login', data);
    return response.data;
};
