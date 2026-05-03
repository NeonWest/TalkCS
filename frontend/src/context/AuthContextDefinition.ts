import { createContext } from 'react';
import type { AuthResponse } from '../api/auth';

export interface AuthContextType {
    user: AuthResponse | null;
    token: string | null;
    login: (data: AuthResponse) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);
