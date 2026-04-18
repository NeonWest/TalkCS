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
}

export interface CalendarEventRequest {
    title: string;
    description: string;
    startDate: string;
    endDate?: string;
    categoryId?: number;
    eventType: string;
}

export const getCalendarEvents = (year: number, month: number, categoryId?: number) =>
    api.get<{ events: CalendarEvent[]; year: number; month: number }>('/calendar', {
        params: { year, month, ...(categoryId != null ? { categoryId } : {}) },
    }).then(r => r.data);

export const getUpcomingEvents = (categoryId?: number, limit = 5) =>
    api.get<{ events: CalendarEvent[]; count: number }>('/calendar/upcoming', {
        params: { limit, ...(categoryId != null ? { categoryId } : {}) },
    }).then(r => r.data);

export const createCalendarEvent = (req: CalendarEventRequest) =>
    api.post<CalendarEvent>('/calendar', req).then(r => r.data);

export const updateCalendarEvent = (id: number, req: CalendarEventRequest) =>
    api.put<CalendarEvent>(`/calendar/${id}`, req).then(r => r.data);

export const deleteCalendarEvent = (id: number) =>
    api.delete(`/calendar/${id}`);
