import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import BadgesPage from './BadgesPage';
import * as badgesApi from '../api/badges';

vi.mock('../api/badges', () => ({ getUserBadges: vi.fn() }));

const renderAt = (username: string) => render(
    <MemoryRouter initialEntries={[`/profile/${username}/badges`]}>
        <Routes>
            <Route path="/profile/:username/badges" element={<BadgesPage />} />
        </Routes>
    </MemoryRouter>
);

describe('BadgesPage', () => {
    beforeEach(() => vi.clearAllMocks());

    it('fetches badges for username + renders heading', async () => {
        (badgesApi.getUserBadges as ReturnType<typeof vi.fn>).mockResolvedValue([
            { id: 1, name: 'First Post', description: 'd', iconKey: 'post1', type: 'MILESTONE', earned: true, awardedAt: '2025-01-01' },
        ]);
        renderAt('alice');
        await waitFor(() => {
            expect(badgesApi.getUserBadges).toHaveBeenCalledWith('alice');
            expect(screen.getByText(/alice's Achievements/)).toBeInTheDocument();
        });
    });

    it('handles empty badge list', async () => {
        (badgesApi.getUserBadges as ReturnType<typeof vi.fn>).mockResolvedValue([]);
        renderAt('bob');
        await waitFor(() => {
            expect(badgesApi.getUserBadges).toHaveBeenCalledWith('bob');
        });
    });
});
