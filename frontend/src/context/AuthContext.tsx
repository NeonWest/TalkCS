import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { AuthResponse } from '../api/auth';
import { AuthContext } from './AuthContextDefinition';
import api from '../api/api';

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthResponse | null>(() => {
        const stored = localStorage.getItem('user');
        return stored ? JSON.parse(stored) : null;
    });

    const [token, setToken] = useState<string | null>(() => {
        return localStorage.getItem('token');
    });

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    const login = (data: AuthResponse) => {
        setUser(data);
        setToken(data.token);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data));
    };

    // Verify token on mount to ensure session is still valid
    useEffect(() => {
        if (token) {
            api.get('/api/users/me')
                .catch((error) => {
                    if (error.response?.status === 401) {
                        logout();
                    }
                });
        }
    }, [token]); // token as dependency

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
            {children}
        </AuthContext.Provider>
    );
}
