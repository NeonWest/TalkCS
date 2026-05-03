import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/useAuth';
import {
    getCalendarEvents,
    createCalendarEvent,
    deleteCalendarEvent,
    submitEventProposal,
    getPendingProposals,
    approveProposal,
    rejectProposal,
    updateCalendarEvent,
    type CalendarEvent,
    type CalendarEventRequest,
    type CalendarEventProposal,
} from '../api/calendar';
import { getCategories } from '../api/categories';
import { EventManager, type Event } from '../components/ui/event-manager';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Check, X } from 'lucide-react';

const EVENT_TYPE_TO_COLOR: Record<string, string> = {
    EXAM: 'red',
    DEADLINE: 'orange',
    LECTURE: 'blue',
    OTHER: 'purple',
};

const COLOR_TO_EVENT_TYPE: Record<string, string> = {
    red: 'EXAM',
    orange: 'DEADLINE',
    blue: 'LECTURE',
    purple: 'OTHER',
};

interface Category { id: number; name: string; }

export default function CalendarPage() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'PROFESSOR';

    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [proposals, setProposals] = useState<CalendarEventProposal[]>([]);
    const [showProposals, setShowProposals] = useState(false);
    const [proposalAction, setProposalAction] = useState<{ id: number; note: string } | null>(null);

    useEffect(() => {
        getCategories().then(data => setCategories(data)).catch(() => {});
    }, []);

    useEffect(() => {
        const fetchEvents = () => {
            setLoading(true);
            const now = new Date();
            getCalendarEvents(now.getFullYear(), now.getMonth() + 1)
                .then(data => setEvents(data.events))
                .catch(() => setEvents([]))
                .finally(() => setLoading(false));
        };
        fetchEvents();
    }, []);

    useEffect(() => {
        if (isAdmin && showProposals) {
            getPendingProposals().then(setProposals).catch(() => {});
        }
    }, [isAdmin, showProposals]);

    const mappedEvents: Event[] = useMemo(() => {
        return events.map(e => ({
            id: e.id.toString(),
            title: e.title,
            description: e.description,
            startTime: new Date(e.startDate + 'T00:00:00'),
            endTime: new Date((e.endDate || e.startDate) + 'T23:59:59'),
            color: EVENT_TYPE_TO_COLOR[e.eventType] || 'blue',
            category: e.categoryName,
            tags: [e.eventType],
            publicEvent: e.publicEvent
        }));
    }, [events]);

    const handleCreate = async (event: Omit<Event, "id">) => {
        const startDate = event.startTime.toISOString().split('T')[0];
        const endDate = event.endTime.toISOString().split('T')[0];
        const categoryId = categories.find(c => c.name === event.category)?.id;
        const eventType = COLOR_TO_EVENT_TYPE[event.color] || 'OTHER';

        const payload: CalendarEventRequest = {
            title: event.title,
            description: event.description || '',
            startDate,
            endDate,
            categoryId,
            eventType,
            publicEvent: event.publicEvent
        };

        try {
            if (isAdmin) {
                // Admins create events directly (public or private based on toggle)
                const created = await createCalendarEvent(payload);
                setEvents(prev => [...prev, created]);
            } else {
                if (event.publicEvent) {
                    // Users submit proposals for public events
                    await submitEventProposal(payload);
                    alert('Public event proposal submitted for admin review!');
                } else {
                    // Users create private events directly
                    const created = await createCalendarEvent(payload);
                    setEvents(prev => [...prev, created]);
                }
            }
        } catch (err) {
            console.error(err);
            alert('Failed to create event.');
        }
    };

    const handleUpdate = async (id: string, eventUpdate: Partial<Event>) => {
        const existing = events.find(e => e.id.toString() === id);
        if (!existing) return;

        const payload: CalendarEventRequest = {
            title: eventUpdate.title || existing.title,
            description: eventUpdate.description || existing.description,
            startDate: eventUpdate.startTime ? eventUpdate.startTime.toISOString().split('T')[0] : existing.startDate,
            endDate: eventUpdate.endTime ? eventUpdate.endTime.toISOString().split('T')[0] : existing.endDate,
            categoryId: categories.find(c => c.name === eventUpdate.category)?.id || existing.categoryId,
            eventType: COLOR_TO_EVENT_TYPE[eventUpdate.color || ''] || existing.eventType,
            publicEvent: eventUpdate.publicEvent !== undefined ? eventUpdate.publicEvent : existing.publicEvent
        };

        try {
            const updated = await updateCalendarEvent(existing.id, payload);
            setEvents(prev => prev.map(e => e.id === updated.id ? updated : e));
        } catch (err) {
            console.error(err);
            alert('Failed to update event.');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteCalendarEvent(parseInt(id));
            setEvents(prev => prev.filter(e => e.id.toString() !== id));
        } catch (err) {
            console.error(err);
            alert('Failed to delete event.');
        }
    };

    const handleApprove = async (id: number) => {
        try {
            const created = await approveProposal(id);
            setProposals(prev => prev.filter(p => p.id !== id));
            setEvents(prev => [...prev, created]);
        } catch {
            alert('Failed to approve proposal.');
        }
    };

    const handleReject = async (id: number, note: string) => {
        try {
            await rejectProposal(id, note);
            setProposals(prev => prev.filter(p => p.id !== id));
            setProposalAction(null);
        } catch {
            alert('Failed to reject proposal.');
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <main className="max-w-6xl mx-auto px-4 py-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-primary">Community Calendar</h1>
                    <div className="flex gap-2">
                        {isAdmin && (
                            <Button
                                variant="outline"
                                onClick={() => setShowProposals(!showProposals)}
                                className="border-primary/50 text-primary hover:bg-primary/10"
                            >
                                Proposals {proposals.length > 0 && `(${proposals.length})`}
                            </Button>
                        )}
                    </div>
                </div>

                {isAdmin && showProposals && (
                    <Card className="mb-8 p-6 bg-card border-border">
                        <h2 className="text-xl font-semibold mb-4 text-foreground">Pending Proposals</h2>
                        {proposals.length === 0 ? (
                            <p className="text-muted-foreground">No pending proposals.</p>
                        ) : (
                            <div className="grid gap-4">
                                {proposals.map(p => (
                                    <div key={p.id} className="flex items-center justify-between p-4 bg-muted rounded-lg border border-border">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge variant="outline" className="border-primary/30 text-primary">{p.eventType}</Badge>
                                                <h3 className="font-medium text-foreground">{p.title}</h3>
                                            </div>
                                            <p className="text-sm text-muted-foreground">{p.description}</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {p.startDate} {p.endDate ? `→ ${p.endDate}` : ''} · by {p.submittedByUsername}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button size="sm" onClick={() => handleApprove(p.id)} className="bg-green-600 hover:bg-green-700 text-white">
                                                <Check className="h-4 w-4 mr-1" /> Approve
                                            </Button>
                                            <Button size="sm" variant="destructive" onClick={() => setProposalAction({ id: p.id, note: '' })}>
                                                <X className="h-4 w-4 mr-1" /> Reject
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                )}

                {proposalAction && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[150] p-4">
                        <Card className="w-full max-w-md p-6 bg-card border-border">
                            <h3 className="text-lg font-semibold mb-4 text-foreground">Reject Proposal</h3>
                            <textarea
                                value={proposalAction.note}
                                onChange={e => setProposalAction({ ...proposalAction, note: e.target.value })}
                                placeholder="Rejection reason (optional)"
                                className="w-full bg-popover border-border rounded-md p-3 mb-4 resize-none h-24 text-sm text-foreground"
                            />
                            <div className="flex justify-end gap-2">
                                <Button variant="ghost" className="text-muted-foreground hover:text-foreground" onClick={() => setProposalAction(null)}>Cancel</Button>
                                <Button variant="destructive" onClick={() => handleReject(proposalAction.id, proposalAction.note)}>Confirm Reject</Button>
                            </div>
                        </Card>
                    </div>
                )}

                {loading ? (
                    <p className="text-muted-foreground text-center py-12">Loading calendar...</p>
                ) : (
                    <EventManager
                        events={mappedEvents}
                        onEventCreate={handleCreate}
                        onEventUpdate={handleUpdate}
                        onEventDelete={handleDelete}
                        categories={categories.map(c => c.name)}
                        availableTags={['EXAM', 'DEADLINE', 'LECTURE', 'OTHER']}
                        defaultView="month"
                        isAdmin={isAdmin}
                    />
                )}
            </main>
        </div>
    );
}
