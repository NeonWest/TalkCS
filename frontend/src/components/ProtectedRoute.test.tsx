import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { AuthProvider } from '../context/AuthContext';

vi.mock('../api/api', () => ({
    default: { get: vi.fn(() => Promise.resolve({ data: {} })) },
}));

const wrap = (initial: string) => (
    <MemoryRouter initialEntries={[initial]}>
        <AuthProvider>
            <Routes>
                <Route path="/login" element={<div>Login Page</div>} />
                <Route path="/secret" element={
                    <ProtectedRoute><div>Secret Content</div></ProtectedRoute>
                } />
            </Routes>
        </AuthProvider>
    </MemoryRouter>
);

describe('ProtectedRoute', () => {
    beforeEach(() => localStorage.clear());

    it('redirects unauthenticated users to /login', () => {
        render(wrap('/secret'));
        expect(screen.getByText('Login Page')).toBeInTheDocument();
        expect(screen.queryByText('Secret Content')).not.toBeInTheDocument();
    });

    it('renders children when token present', () => {
        // forge a valid-looking JWT (header.payload.signature) with future exp
        const future = Math.floor(Date.now() / 1000) + 3600;
        const payload = btoa(JSON.stringify({ sub: 'u', exp: future })).replace(/=/g, '');
        const fakeToken = `eyJhbGciOiJIUzI1NiJ9.${payload}.sig`;
        localStorage.setItem('token', fakeToken);
        localStorage.setItem('user', JSON.stringify({ username: 'u', token: fakeToken }));

        render(wrap('/secret'));
        expect(screen.getByText('Secret Content')).toBeInTheDocument();
    });
});
