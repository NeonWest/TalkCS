import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCalendarEvents, getUpcomingEvents, createCalendarEvent, submitEventProposal } from './calendar';
import api from './api';

vi.mock('./api', () => ({
    default: { get: vi.fn(), post: vi.fn() },
}));

const mockGet = api.get as ReturnType<typeof vi.fn>;
const mockPost = api.post as ReturnType<typeof vi.fn>;

describe('calendar API', () => {
    beforeEach(() => vi.clearAllMocks());

    it('getCalendarEvents passes year/month/categoryId', async () => {
        mockGet.mockResolvedValue({ data: { events: [] } });
        await getCalendarEvents(2026, 5, 3);
        expect(mockGet).toHaveBeenCalledWith('/api/calendar', { params: { year: 2026, month: 5, categoryId: 3 } });
    });

    it('getCalendarEvents omits categoryId when null', async () => {
        mockGet.mockResolvedValue({ data: { events: [] } });
        await getCalendarEvents(2026, 5);
        expect(mockGet).toHaveBeenCalledWith('/api/calendar', { params: { year: 2026, month: 5 } });
    });

    it('getUpcomingEvents passes limit + categoryId', async () => {
        mockGet.mockResolvedValue({ data: { events: [] } });
        await getUpcomingEvents(1, 3);
        expect(mockGet).toHaveBeenCalledWith('/api/calendar/upcoming', { params: { limit: 3, categoryId: 1 } });
    });

    it('createCalendarEvent + submitEventProposal post correctly', async () => {
        mockPost.mockResolvedValue({ data: {} });
        const req = { title: 't', description: 'd', startDate: '2026-05-01', eventType: 'EXAM' };
        await createCalendarEvent(req);
        expect(mockPost).toHaveBeenCalledWith('/api/calendar', req);
        await submitEventProposal(req);
        expect(mockPost).toHaveBeenCalledWith('/api/calendar/proposals', req);
    });
});
