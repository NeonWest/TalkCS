import api from './api';

export interface CalendarEvent {
    id: number;
    title: string;
    description: string;
    startDate: string;
    endDate?: string;
    categoryId?: number;
    categoryName?: string;
    createdByUsername: string;
    eventType: 'EXAM' | 'DEADLINE' | 'LECTURE' | 'OTHER';
    createdAt: string;
    publicEvent: boolean;
}

export interface CalendarEventRequest {
    title: string;
    description: string;
    startDate: string;
    endDate?: string;
    categoryId?: number;
    eventType: string;
}

export interface CalendarEventProposal {
    id: number;
    title: string;
    description: string;
    startDate: string;
    endDate?: string;
    eventType: string;
    categoryId?: number;
    categoryName?: string;
    submittedByUsername: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    adminNote?: string;
    createdAt: string;
}

export const getCalendarEvents = (year: number, month: number, categoryId?: number) =>
    api.get<{ events: CalendarEvent[]; year: number; month: number }>('/api/calendar', {
        params: { year, month, ...(categoryId != null ? { categoryId } : {}) },
    }).then(r => r.data);

export const getUpcomingEvents = (categoryId?: number, limit = 5) =>
    api.get<{ events: CalendarEvent[]; count: number }>('/api/calendar/upcoming', {
        params: { limit, ...(categoryId != null ? { categoryId } : {}) },
    }).then(r => r.data);

export const createCalendarEvent = (req: CalendarEventRequest) =>
    api.post<CalendarEvent>('/api/calendar', req).then(r => r.data);

export const submitEventProposal = (req: CalendarEventRequest) =>
    api.post<CalendarEventProposal>('/api/calendar/proposals', req).then(r => r.data);

export const getPendingProposals = () =>
    api.get<CalendarEventProposal[]>('/api/calendar/proposals').then(r => r.data);

export const getMyProposals = () =>
    api.get<CalendarEventProposal[]>('/api/calendar/proposals/mine').then(r => r.data);

export const approveProposal = (id: number) =>
    api.put<CalendarEvent>(`/api/calendar/proposals/${id}/approve`).then(r => r.data);

export const rejectProposal = (id: number, adminNote?: string) =>
    api.put<CalendarEventProposal>(`/api/calendar/proposals/${id}/reject`, { adminNote }).then(r => r.data);

export const updateCalendarEvent = (id: number, req: CalendarEventRequest) =>
    api.put<CalendarEvent>(`/api/calendar/${id}`, req).then(r => r.data);

export const deleteCalendarEvent = (id: number) =>
    api.delete(`/api/calendar/${id}`);
