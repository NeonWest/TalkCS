import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LeaderboardPage from './LeaderboardPage';
import * as usersApi from '../api/users';

vi.mock('../api/users', () => ({ getLeaderboard: vi.fn() }));

const renderPage = () => render(<MemoryRouter><LeaderboardPage /></MemoryRouter>);

describe('LeaderboardPage', () => {
    beforeEach(() => vi.clearAllMocks());

    it('shows heading and renders users', async () => {
        (usersApi.getLeaderboard as ReturnType<typeof vi.fn>).mockResolvedValue([
            { id: 1, username: 'alice', reputation: 1000, level: 5, levelTitle: 'Expert', role: 'STUDENT' },
            { id: 2, username: 'bob', reputation: 500, level: 4, levelTitle: 'Trusted', role: 'STUDENT' },
        ]);
        renderPage();
        expect(screen.getByText('Leaderboard')).toBeInTheDocument();
        await waitFor(() => {
            expect(screen.getByText('alice')).toBeInTheDocument();
            expect(screen.getByText('bob')).toBeInTheDocument();
        });
    });

    it('shows loading state initially', () => {
        (usersApi.getLeaderboard as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}));
        renderPage();
        expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
});
