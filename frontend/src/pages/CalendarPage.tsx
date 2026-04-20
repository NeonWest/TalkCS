import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import {
    getCalendarEvents,
    createCalendarEvent,
    deleteCalendarEvent,
    submitEventProposal,
    getPendingProposals,
    approveProposal,
    rejectProposal,
    type CalendarEvent,
    type CalendarEventRequest,
    type CalendarEventProposal,
} from '../api/calendar';
import { getCategories } from '../api/categories';

const EVENT_COLORS: Record<string, string> = {
    EXAM: 'bg-red-500/20 text-red-300 border-red-500/30',
    DEADLINE: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    LECTURE: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    OTHER: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

interface Category { id: number; name: string; }

const emptyForm = (): CalendarEventRequest => ({
    title: '', description: '', startDate: '', endDate: '', categoryId: undefined, eventType: 'LECTURE',
});

type ModalMode = 'add' | 'request';

export default function CalendarPage() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';

    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [filterCategoryId, setFilterCategoryId] = useState<number | undefined>(undefined);

    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState<ModalMode>('add');
    const [form, setForm] = useState<CalendarEventRequest>(emptyForm());
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState('');

    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

    const [proposals, setProposals] = useState<CalendarEventProposal[]>([]);
    const [showProposals, setShowProposals] = useState(false);
    const [proposalAction, setProposalAction] = useState<{ id: number; note: string } | null>(null);

    useEffect(() => {
        getCategories().then(data => setCategories(data)).catch(() => {});
    }, []);

    useEffect(() => {
        setLoading(true);
        getCalendarEvents(year, month, filterCategoryId)
            .then(data => setEvents(data.events))
            .catch(() => setEvents([]))
            .finally(() => setLoading(false));
    }, [year, month, filterCategoryId]);

    useEffect(() => {
        if (isAdmin && showProposals) {
            getPendingProposals().then(setProposals).catch(() => {});
        }
    }, [isAdmin, showProposals]);

    const prevMonth = () => { if (month === 1) { setYear(y => y - 1); setMonth(12); } else setMonth(m => m - 1); };
    const nextMonth = () => { if (month === 12) { setYear(y => y + 1); setMonth(1); } else setMonth(m => m + 1); };

    const firstDay = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const eventsByDay: Record<number, CalendarEvent[]> = {};
    events.forEach(e => {
        const d = parseInt(e.startDate.split('-')[2], 10);
        if (!eventsByDay[d]) eventsByDay[d] = [];
        eventsByDay[d].push(e);
    });

    const openModal = (mode: ModalMode) => {
        setForm(emptyForm());
        setFormError('');
        setFormSuccess('');
        setModalMode(mode);
        setShowModal(true);
    };

    const handleSubmit = async (ev: React.FormEvent) => {
        ev.preventDefault();
        setFormError('');
        setFormSuccess('');
        setSaving(true);
        const payload: CalendarEventRequest = {
            ...form,
            endDate: form.endDate || undefined,
            categoryId: form.categoryId || undefined,
        };
        try {
            if (modalMode === 'request') {
                await submitEventProposal(payload);
                setFormSuccess('Request submitted! Admins will review it.');
                setTimeout(() => { setShowModal(false); setForm(emptyForm()); }, 1800);
            } else {
                const created = await createCalendarEvent(payload);
                const eventYear = parseInt(created.startDate.split('-')[0], 10);
                const eventMonth = parseInt(created.startDate.split('-')[1], 10);
                if (eventYear === year && eventMonth === month) {
                    setEvents(prev => [...prev, created]);
                }
                setShowModal(false);
                setForm(emptyForm());
            }
        } catch {
            setFormError(modalMode === 'request' ? 'Failed to submit request.' : 'Failed to create event.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await deleteCalendarEvent(id);
            setEvents(prev => prev.filter(e => e.id !== id));
            setSelectedEvent(null);
        } catch {
            alert('Failed to delete event.');
        }
    };

    const handleApprove = async (id: number) => {
        try {
            const created = await approveProposal(id);
            setProposals(prev => prev.filter(p => p.id !== id));
            const eventYear = parseInt(created.startDate.split('-')[0], 10);
            const eventMonth = parseInt(created.startDate.split('-')[1], 10);
            if (eventYear === year && eventMonth === month) {
                setEvents(prev => [...prev, created]);
            }
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

    const cells: (number | null)[] = [
        ...Array(firstDay).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    while (cells.length % 7 !== 0) cells.push(null);

    return (
        <div className="min-h-screen bg-[#1f1f1f] text-gray-100">
            <Navbar />
            <main className="max-w-5xl mx-auto px-4 py-6">

                {/* Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                    <div className="flex items-center gap-3">
                        <button onClick={prevMonth} className="px-3 py-1.5 rounded-lg border border-white/20 text-gray-300 hover:bg-white/10 transition text-sm">‹</button>
                        <h2 className="text-xl font-bold text-gray-100 w-44 text-center">{MONTHS[month - 1]} {year}</h2>
                        <button onClick={nextMonth} className="px-3 py-1.5 rounded-lg border border-white/20 text-gray-300 hover:bg-white/10 transition text-sm">›</button>
                        <button
                            onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth() + 1); }}
                            className="text-xs px-3 py-1.5 rounded-lg border border-white/20 text-gray-400 hover:bg-white/10 transition"
                        >Today</button>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <select
                            value={filterCategoryId ?? ''}
                            onChange={e => setFilterCategoryId(e.target.value ? Number(e.target.value) : undefined)}
                            className="text-sm bg-[#2d2d2d] border border-white/20 rounded-lg px-3 py-1.5 text-gray-300 focus:outline-none focus:ring-1 focus:ring-orange-400"
                        >
                            <option value="">All categories</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        {isAdmin && (
                            <button
                                onClick={() => setShowProposals(v => !v)}
                                className="text-sm border border-orange-500/50 text-orange-400 hover:bg-orange-500/10 px-3 py-1.5 rounded-xl transition font-medium"
                            >Proposals</button>
                        )}
                        {isAdmin ? (
                            <button
                                onClick={() => openModal('add')}
                                className="text-sm bg-orange-500 text-white hover:bg-orange-600 px-4 py-1.5 rounded-xl transition font-semibold shadow-sm"
                            >+ Add Event</button>
                        ) : (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => openModal('add')}
                                    className="text-sm bg-[#2d2d2d] border border-white/20 text-gray-300 hover:bg-white/10 px-3 py-1.5 rounded-xl transition font-medium"
                                >+ Private Event</button>
                                <button
                                    onClick={() => openModal('request')}
                                    className="text-sm bg-orange-500 text-white hover:bg-orange-600 px-4 py-1.5 rounded-xl transition font-semibold shadow-sm"
                                >+ Request Event</button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Admin proposals panel */}
                {isAdmin && showProposals && (
                    <div className="mb-6 bg-[#2d2d2d] rounded-xl border border-white/10 p-4">
                        <h3 className="text-sm font-semibold text-gray-200 mb-3">Pending Event Proposals</h3>
                        {proposals.length === 0 ? (
                            <p className="text-sm text-gray-400">No pending proposals.</p>
                        ) : (
                            <div className="space-y-3">
                                {proposals.map(p => (
                                    <div key={p.id} className="bg-[#1f1f1f] rounded-lg p-3 border border-white/10">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`text-xs px-1.5 py-0.5 rounded border ${EVENT_COLORS[p.eventType] ?? EVENT_COLORS.OTHER}`}>{p.eventType}</span>
                                                    <span className="text-sm font-medium text-gray-100">{p.title}</span>
                                                </div>
                                                {p.description && <p className="text-xs text-gray-400 mb-1">{p.description}</p>}
                                                <p className="text-xs text-gray-500">{p.startDate}{p.endDate ? ` → ${p.endDate}` : ''} · by {p.submittedByUsername}{p.categoryName ? ` · ${p.categoryName}` : ''}</p>
                                            </div>
                                            <div className="flex gap-2 shrink-0">
                                                <button
                                                    onClick={() => handleApprove(p.id)}
                                                    className="text-xs px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                                                >Approve</button>
                                                <button
                                                    onClick={() => setProposalAction({ id: p.id, note: '' })}
                                                    className="text-xs px-3 py-1 bg-red-600/30 hover:bg-red-600/50 text-red-300 rounded-lg transition"
                                                >Reject</button>
                                            </div>
                                        </div>
                                        {proposalAction?.id === p.id && (
                                            <div className="mt-2 flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Rejection reason (optional)"
                                                    value={proposalAction.note}
                                                    onChange={e => setProposalAction(a => a ? { ...a, note: e.target.value } : null)}
                                                    className="flex-1 bg-[#2d2d2d] border border-white/15 rounded px-2 py-1 text-xs text-gray-200 focus:outline-none focus:ring-1 focus:ring-red-400"
                                                />
                                                <button
                                                    onClick={() => handleReject(p.id, proposalAction.note)}
                                                    className="text-xs px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                                                >Confirm</button>
                                                <button
                                                    onClick={() => setProposalAction(null)}
                                                    className="text-xs px-2 py-1 text-gray-400 hover:text-white transition"
                                                >Cancel</button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Legend */}
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                    {(['EXAM', 'DEADLINE', 'LECTURE', 'OTHER'] as const).map(type => (
                        <span key={type} className={`text-xs px-2 py-0.5 rounded-full border ${EVENT_COLORS[type]}`}>{type}</span>
                    ))}
                    {!isAdmin && (
                        <>
                            <span className="text-xs px-2 py-0.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300">🔒 Private</span>
                            <span className="text-xs px-2 py-0.5 rounded-full border border-green-500/30 bg-green-500/10 text-green-300">🌐 Public</span>
                        </>
                    )}
                </div>

                {/* Calendar grid */}
                {loading ? (
                    <p className="text-gray-400 text-center py-12">Loading calendar...</p>
                ) : (
                    <div className="rounded-xl border border-white/10 bg-[#2d2d2d] overflow-hidden shadow-2xl">
                        <div className="overflow-x-auto">
                            <div className="min-w-[600px] sm:min-w-0">
                                <div className="grid grid-cols-7 border-b border-white/10 bg-[#242424]">
                                    {DAYS.map(d => (
                                        <div key={d} className="text-center text-[10px] sm:text-xs font-bold text-gray-500 py-3 uppercase tracking-widest">{d}</div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-7">
                                    {cells.map((day, idx) => {
                                        if (!day) return <div key={`e-${idx}`} className="min-h-[80px] sm:min-h-[110px] border-b border-r border-white/5 bg-[#1a1a1a]/30" />;
                                        const dayStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                        const isToday = dayStr === todayStr;
                                        const dayEvents = eventsByDay[day] || [];
                                        return (
                                            <div key={day} className={`min-h-[80px] sm:min-h-[110px] p-1 sm:p-2 border-b border-r border-white/5 transition-colors hover:bg-white/[0.02] ${isToday ? 'bg-orange-500/5' : ''}`}>
                                                <div className="flex justify-between items-start mb-1 sm:mb-2">
                                                    <span className={`text-[10px] sm:text-xs font-bold flex items-center justify-center h-5 w-5 sm:h-6 sm:w-6 rounded-full ${isToday ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-gray-500'}`}>
                                                        {day}
                                                    </span>
                                                </div>
                                                <div className="space-y-1">
                                                    {dayEvents.slice(0, 3).map(ev => (
                                                        <button
                                                            key={ev.id}
                                                            onClick={() => setSelectedEvent(ev)}
                                                            className={`w-full text-left text-[9px] sm:text-[10px] px-1.5 py-1 rounded border leading-tight truncate transition hover:brightness-110 active:scale-[0.98] ${EVENT_COLORS[ev.eventType]} ${!ev.publicEvent ? 'opacity-70' : ''}`}
                                                            title={`${ev.title}${!ev.publicEvent ? ' (private)' : ''}`}
                                                        >
                                                            <div className="flex items-center gap-1">
                                                                {!ev.publicEvent && <span className="shrink-0 text-[8px]">🔒</span>}
                                                                <span className="truncate">{ev.title}</span>
                                                            </div>
                                                        </button>
                                                    ))}
                                                    {dayEvents.length > 3 && (
                                                        <p className="text-[9px] sm:text-[10px] text-gray-500 font-medium pl-1">+{dayEvents.length - 3} more</p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Event detail modal */}
            {selectedEvent && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[120] p-4 animate-in fade-in duration-200" onClick={() => setSelectedEvent(null)}>
                    <div className="bg-[#2d2d2d] rounded-2xl shadow-2xl w-full max-w-md p-6 border border-white/10 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="flex items-start justify-between gap-4 mb-3">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs px-2 py-0.5 rounded-full border ${EVENT_COLORS[selectedEvent.eventType]}`}>{selectedEvent.eventType}</span>
                                    {!selectedEvent.publicEvent && <span className="text-xs px-2 py-0.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300">Private</span>}
                                </div>
                                <h3 className="text-lg font-semibold text-gray-100 mt-2">{selectedEvent.title}</h3>
                            </div>
                            <button onClick={() => setSelectedEvent(null)} className="text-gray-400 hover:text-white text-xl leading-none">×</button>
                        </div>
                        {selectedEvent.description && <p className="text-sm text-gray-300 mb-3">{selectedEvent.description}</p>}
                        <div className="text-sm text-gray-400 space-y-1">
                            <p><span className="text-gray-300">Date:</span> {selectedEvent.startDate}{selectedEvent.endDate ? ` → ${selectedEvent.endDate}` : ''}</p>
                            {selectedEvent.categoryName && <p><span className="text-gray-300">Category:</span> {selectedEvent.categoryName}</p>}
                            <p><span className="text-gray-300">By:</span> {selectedEvent.createdByUsername}</p>
                        </div>
                        {(user?.username === selectedEvent.createdByUsername || isAdmin) && (
                            <button
                                onClick={() => handleDelete(selectedEvent.id)}
                                className="mt-4 text-sm text-red-400 hover:text-red-300 transition"
                            >Delete event</button>
                        )}
                    </div>
                </div>
            )}

            {/* Create / Request event modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#2d2d2d] rounded-xl shadow-xl w-full max-w-md p-6 border border-white/10">
                        <h3 className="text-lg font-semibold text-gray-100 mb-1">
                            {modalMode === 'request' ? 'Request Public Event' : isAdmin ? 'Add Public Event' : 'Add Private Event'}
                        </h3>
                        {modalMode === 'request' && (
                            <p className="text-xs text-gray-400 mb-4">Your request will be reviewed by an admin before it becomes visible to everyone.</p>
                        )}
                        {modalMode === 'add' && !isAdmin && (
                            <p className="text-xs text-gray-400 mb-4">This event will only be visible to you. Use "Request Event" to suggest a public event.</p>
                        )}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                    required
                                    className="w-full bg-[#242424] border border-white/15 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                                    placeholder="e.g. Midterm Exam"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                                <textarea
                                    value={form.description}
                                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                    rows={2}
                                    className="w-full bg-[#242424] border border-white/15 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        value={form.startDate}
                                        onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                                        required
                                        className="w-full bg-[#242424] border border-white/15 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">End Date (opt.)</label>
                                    <input
                                        type="date"
                                        value={form.endDate}
                                        onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                                        className="w-full bg-[#242424] border border-white/15 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Type</label>
                                    <select
                                        value={form.eventType}
                                        onChange={e => setForm(f => ({ ...f, eventType: e.target.value }))}
                                        className="w-full bg-[#242424] border border-white/15 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                                    >
                                        <option value="EXAM">Exam</option>
                                        <option value="DEADLINE">Deadline</option>
                                        <option value="LECTURE">Lecture</option>
                                        <option value="OTHER">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Category (opt.)</label>
                                    <select
                                        value={form.categoryId ?? ''}
                                        onChange={e => setForm(f => ({ ...f, categoryId: e.target.value ? Number(e.target.value) : undefined }))}
                                        className="w-full bg-[#242424] border border-white/15 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                                    >
                                        <option value="">None</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            {formError && <p className="text-sm text-red-400">{formError}</p>}
                            {formSuccess && <p className="text-sm text-green-400">{formSuccess}</p>}
                            <div className="flex justify-end gap-3 pt-1">
                                <button
                                    type="button"
                                    onClick={() => { setShowModal(false); setFormError(''); setFormSuccess(''); }}
                                    className="text-sm px-4 py-2 rounded-lg border border-white/20 text-gray-300 hover:bg-white/10 transition"
                                >Cancel</button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="text-sm px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium transition disabled:opacity-50"
                                >{saving ? 'Saving...' : modalMode === 'request' ? 'Submit Request' : 'Create'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
