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

export const register = async (data: RegisterRequest) => {
    return api.post<AuthResponse>('/api/auth/register', data);
};

export const login = async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/api/auth/login', data);
    return response.data;
};

export const forgotPassword = async (email: string): Promise<string> => {
    const response = await api.post<string>('/api/auth/forgot-password', { email });
    return response.data;
};

export const resetPassword = async (token: string, newPassword: string): Promise<string> => {
    const response = await api.post<string>('/api/auth/reset-password', { token, newPassword });
    return response.data;
};
