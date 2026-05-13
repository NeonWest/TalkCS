import { describe, it, expect, vi, beforeEach } from 'vitest';
import { login, register, forgotPassword, resetPassword } from './auth';
import api from './api';

vi.mock('./api', () => ({
    default: {
        post: vi.fn(),
    },
}));

describe('auth API', () => {
    beforeEach(() => vi.clearAllMocks());

    it('login posts to /api/auth/login and returns data', async () => {
        const resp = { data: { id: 1, token: 'tkn', username: 'u', email: 'u@t.com', role: 'STUDENT' } };
        (api.post as ReturnType<typeof vi.fn>).mockResolvedValue(resp);

        const result = await login({ email: 'u@t.com', password: 'pw' });
        expect(api.post).toHaveBeenCalledWith('/api/auth/login', { email: 'u@t.com', password: 'pw' });
        expect(result.token).toBe('tkn');
    });

    it('register posts to /api/auth/register', async () => {
        (api.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { token: 't' } });
        await register({ username: 'u', email: 'u@t.com', password: 'Pass1!' });
        expect(api.post).toHaveBeenCalledWith('/api/auth/register', expect.objectContaining({ email: 'u@t.com' }));
    });

    it('forgotPassword sends email payload', async () => {
        (api.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: 'ok' });
        const out = await forgotPassword('u@t.com');
        expect(api.post).toHaveBeenCalledWith('/api/auth/forgot-password', { email: 'u@t.com' });
        expect(out).toBe('ok');
    });

    it('resetPassword sends token + newPassword', async () => {
        (api.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: 'done' });
        await resetPassword('abc', 'newpw');
        expect(api.post).toHaveBeenCalledWith('/api/auth/reset-password', { token: 'abc', newPassword: 'newpw' });
    });
});
