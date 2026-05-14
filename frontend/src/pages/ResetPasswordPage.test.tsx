import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ResetPasswordPage from './ResetPasswordPage';
import * as authApi from '../api/auth';

vi.mock('../api/auth', () => ({ resetPassword: vi.fn() }));

const renderWithToken = (token: string) => render(
    <MemoryRouter initialEntries={[`/reset-password?token=${token}`]}>
        <ResetPasswordPage />
    </MemoryRouter>
);

describe('ResetPasswordPage', () => {
    beforeEach(() => vi.clearAllMocks());

    it('shows invalid link when token missing', () => {
        render(<MemoryRouter initialEntries={['/reset-password']}><ResetPasswordPage /></MemoryRouter>);
        expect(screen.getByText(/invalid reset link/i)).toBeInTheDocument();
    });

    it('rejects mismatched passwords', async () => {
        renderWithToken('abc');
        const inputs = screen.getAllByPlaceholderText('••••••••');
        fireEvent.change(inputs[0], { target: { value: 'Password1!' } });
        fireEvent.change(inputs[1], { target: { value: 'DifferentPw1!' } });
        fireEvent.click(screen.getByRole('button'));
        await waitFor(() => {
            expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
        });
    });

    it('rejects short password', async () => {
        renderWithToken('abc');
        const inputs = screen.getAllByPlaceholderText('••••••••');
        fireEvent.change(inputs[0], { target: { value: 'short' } });
        fireEvent.change(inputs[1], { target: { value: 'short' } });
        fireEvent.click(screen.getByRole('button'));
        await waitFor(() => {
            expect(screen.getByText(/at least 6 characters/i)).toBeInTheDocument();
        });
    });

    it('submits valid token+password', async () => {
        (authApi.resetPassword as ReturnType<typeof vi.fn>).mockResolvedValue('ok');
        renderWithToken('abc');
        const inputs = screen.getAllByPlaceholderText('••••••••');
        fireEvent.change(inputs[0], { target: { value: 'newPw1!' } });
        fireEvent.change(inputs[1], { target: { value: 'newPw1!' } });
        fireEvent.click(screen.getByRole('button'));
        await waitFor(() => {
            expect(authApi.resetPassword).toHaveBeenCalledWith('abc', 'newPw1!');
        });
    });
});
