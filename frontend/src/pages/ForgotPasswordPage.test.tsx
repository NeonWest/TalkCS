import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ForgotPasswordPage from './ForgotPasswordPage';
import * as authApi from '../api/auth';

vi.mock('../api/auth', () => ({ forgotPassword: vi.fn() }));

const renderPage = () => render(<MemoryRouter><ForgotPasswordPage /></MemoryRouter>);

describe('ForgotPasswordPage', () => {
    beforeEach(() => vi.clearAllMocks());

    it('renders email input', () => {
        renderPage();
        expect(screen.getByPlaceholderText(/you@university.edu/i)).toBeInTheDocument();
    });

    it('shows success message after submit', async () => {
        (authApi.forgotPassword as ReturnType<typeof vi.fn>).mockResolvedValue('ok');
        renderPage();
        fireEvent.change(screen.getByPlaceholderText(/you@university.edu/i), { target: { value: 'u@t.com' } });
        fireEvent.click(screen.getByRole('button'));
        await waitFor(() => {
            expect(screen.getByText(/check your email/i)).toBeInTheDocument();
        });
        expect(authApi.forgotPassword).toHaveBeenCalledWith('u@t.com');
    });

    it('shows error on failure', async () => {
        (authApi.forgotPassword as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('x'));
        renderPage();
        fireEvent.change(screen.getByPlaceholderText(/you@university.edu/i), { target: { value: 'u@t.com' } });
        fireEvent.click(screen.getByRole('button'));
        await waitFor(() => {
            expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
        });
    });
});
