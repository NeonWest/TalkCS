import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from './LoginPage';
import { AuthProvider } from '../context/AuthContext';
import * as authApi from '../api/auth';

vi.mock('../api/api', () => ({
    default: { get: vi.fn(() => Promise.resolve({ data: {} })) },
}));
vi.mock('../api/auth', () => ({
    login: vi.fn(),
}));

const renderPage = () => render(
    <MemoryRouter>
        <AuthProvider>
            <LoginPage />
        </AuthProvider>
    </MemoryRouter>
);

describe('LoginPage', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    it('renders email and password inputs', () => {
        renderPage();
        expect(screen.getByPlaceholderText(/you@university.edu/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    });

    it('shows validation errors when submitted empty', async () => {
        renderPage();
        fireEvent.click(screen.getByRole('button'));
        await waitFor(() => {
            expect(screen.getByText('Email is required')).toBeInTheDocument();
            expect(screen.getByText('Password is required')).toBeInTheDocument();
        });
    });

    it('calls loginApi on valid submit', async () => {
        (authApi.login as ReturnType<typeof vi.fn>).mockResolvedValue({
            id: 1, token: 'tkn', username: 'u', email: 'u@t.com', role: 'STUDENT',
        });
        renderPage();
        fireEvent.input(screen.getByPlaceholderText(/you@university.edu/i), { target: { value: 'u@t.com' } });
        fireEvent.input(screen.getByPlaceholderText('••••••••'), { target: { value: 'pw' } });
        fireEvent.click(screen.getByRole('button'));

        await waitFor(() => {
            expect(authApi.login).toHaveBeenCalledWith({ email: 'u@t.com', password: 'pw' });
        });
    });

    it('shows error on failed login', async () => {
        (authApi.login as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('bad creds'));
        renderPage();
        fireEvent.input(screen.getByPlaceholderText(/you@university.edu/i), { target: { value: 'u@t.com' } });
        fireEvent.input(screen.getByPlaceholderText('••••••••'), { target: { value: 'wrong' } });
        fireEvent.click(screen.getByRole('button'));

        await waitFor(() => {
            expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
        });
    });
});
