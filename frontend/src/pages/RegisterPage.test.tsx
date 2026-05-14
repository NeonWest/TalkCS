import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RegisterPage from './RegisterPage';
import { AuthProvider } from '../context/AuthContext';
import * as authApi from '../api/auth';

vi.mock('../api/api', () => ({
    default: { get: vi.fn(() => Promise.resolve({ data: {} })) },
}));
vi.mock('../api/auth', () => ({ register: vi.fn() }));

const renderPage = () => render(
    <MemoryRouter>
        <AuthProvider>
            <RegisterPage />
        </AuthProvider>
    </MemoryRouter>
);

describe('RegisterPage', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    it('renders username/email/password fields', () => {
        renderPage();
        expect(screen.getByPlaceholderText(/yourname/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/you@university.edu/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/min. 8 characters/i)).toBeInTheDocument();
    });

    it('shows minLength error when password too short', async () => {
        renderPage();
        fireEvent.input(screen.getByPlaceholderText(/yourname/i), { target: { value: 'u' } });
        fireEvent.input(screen.getByPlaceholderText(/you@university.edu/i), { target: { value: 'u@t.com' } });
        fireEvent.input(screen.getByPlaceholderText(/min. 8 characters/i), { target: { value: 'short' } });
        fireEvent.click(screen.getByRole('button'));
        await waitFor(() => {
            expect(screen.getByText(/minimum 8 characters/i)).toBeInTheDocument();
        });
    });

    it('calls registerApi on valid submit', async () => {
        (authApi.register as ReturnType<typeof vi.fn>).mockResolvedValue({
            data: { id: 1, token: 't', username: 'u', email: 'u@t.com', role: 'STUDENT' },
        });
        renderPage();
        fireEvent.input(screen.getByPlaceholderText(/yourname/i), { target: { value: 'u' } });
        fireEvent.input(screen.getByPlaceholderText(/you@university.edu/i), { target: { value: 'u@t.com' } });
        fireEvent.input(screen.getByPlaceholderText(/min. 8 characters/i), { target: { value: 'Password1!' } });
        fireEvent.click(screen.getByRole('button'));
        await waitFor(() => {
            expect(authApi.register).toHaveBeenCalledWith({ username: 'u', email: 'u@t.com', password: 'Password1!' });
        });
    });
});
