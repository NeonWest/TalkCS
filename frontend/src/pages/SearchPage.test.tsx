import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SearchPage from './SearchPage';
import * as searchApi from '../api/search';

vi.mock('../api/search', () => ({ search: vi.fn() }));

const renderAt = (path: string) => render(
    <MemoryRouter initialEntries={[path]}><SearchPage /></MemoryRouter>
);

describe('SearchPage', () => {
    beforeEach(() => vi.clearAllMocks());

    it('prompts when query empty', () => {
        renderAt('/search');
        expect(screen.getByText(/enter a keyword/i)).toBeInTheDocument();
    });

    it('calls search and shows result count', async () => {
        (searchApi.search as ReturnType<typeof vi.fn>).mockResolvedValue({
            posts: [{ id: 1, title: 'T' }], categories: [], users: [],
        });
        renderAt('/search?q=java');
        await waitFor(() => {
            expect(searchApi.search).toHaveBeenCalledWith('java');
            expect(screen.getByText(/Found 1 results for "java"/)).toBeInTheDocument();
        });
    });

    it('shows no-results state', async () => {
        (searchApi.search as ReturnType<typeof vi.fn>).mockResolvedValue({ posts: [], categories: [], users: [] });
        renderAt('/search?q=zzz');
        await waitFor(() => {
            expect(screen.getByText(/no results found/i)).toBeInTheDocument();
        });
    });
});
