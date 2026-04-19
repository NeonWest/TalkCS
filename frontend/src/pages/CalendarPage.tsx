import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NavbarSearch from '../components/NavbarSearch';
import NotificationBell from '../components/NotificationBell';
import ChatIcon from '../components/ChatIcon';
import {
    getCalendarEvents,
    createCalendarEvent,
    deleteCalendarEvent,
    type CalendarEvent,
    type CalendarEventRequest,
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

interface Category {
    id: number;
    name: string;
}

const emptyForm = (): CalendarEventRequest => ({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    categoryId: undefined,
    eventType: 'LECTURE',
});

export default function CalendarPage() {
    const navigate = useNavigate();
    const { user, logout, isAuthenticated } = useAuth();
    const isAdmin = user?.role === 'ADMIN';

    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [filterCategoryId, setFilterCategoryId] = useState<number | undefined>(undefined);

    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState<CalendarEventRequest>(emptyForm());
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

    const handleLogout = () => { logout(); navigate('/login'); };
    const handleMyProfile = () => { if (user?.username) navigate(`/profile/${user.username}`); };

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

    const prevMonth = () => {
        if (month === 1) { setYear(y => y - 1); setMonth(12); }
        else setMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (month === 12) { setYear(y => y + 1); setMonth(1); }
        else setMonth(m => m + 1);
    };

    const firstDay = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const eventsByDay: Record<number, CalendarEvent[]> = {};
    events.forEach(e => {
        const d = parseInt(e.startDate.split('-')[2], 10);
        if (!eventsByDay[d]) eventsByDay[d] = [];
        eventsByDay[d].push(e);
    });

    const handleCreate = async (ev: React.FormEvent) => {
        ev.preventDefault();
        setFormError('');
        setSaving(true);
        try {
            const payload: CalendarEventRequest = {
                ...form,
                endDate: form.endDate || undefined,
                categoryId: form.categoryId || undefined,
            };
            const created = await createCalendarEvent(payload);
            const eventYear = parseInt(created.startDate.split('-')[0], 10);
            const eventMonth = parseInt(created.startDate.split('-')[1], 10);
            if (eventYear === year && eventMonth === month) {
                setEvents(prev => [...prev, created]);
            }
            setShowModal(false);
            setForm(emptyForm());
        } catch {
            setFormError('Failed to create event.');
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

    const cells: (number | null)[] = [
        ...Array(firstDay).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    while (cells.length % 7 !== 0) cells.push(null);

    return (
        <div className="min-h-screen bg-[#1f1f1f] text-gray-100">
            <header className="bg-[#323232] shadow-sm sticky top-0 z-50 border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="font-bold text-gray-100 hover:text-white text-xl leading-none transition cursor-pointer tracking-tight flex items-center gap-2 shrink-0"
                    >
                        <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                        TalkCS
                    </button>
                    <NavbarSearch />
                    <div className="flex items-center gap-1.5 shrink-0">
                        {isAuthenticated ? (
                            <>
                                {isAdmin && (
                                    <><button onClick={() => navigate('/admin')} className="text-sm text-orange-400 hover:text-orange-300 font-medium px-2 py-1 rounded-lg hover:bg-orange-500/10 transition">Admin</button><span className="w-px h-4 bg-white/20 mx-1" /></>
                                )}
                                <ChatIcon />
                                <NotificationBell />
                                <span className="w-px h-4 bg-white/20 mx-1" />
                                <button onClick={handleMyProfile} disabled={!user?.username} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full pl-1.5 pr-3 py-1 transition disabled:opacity-50">
                                    <span className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                                        {user?.username?.charAt(0).toUpperCase() ?? '?'}
                                    </span>
                                    <span className="text-sm text-gray-200 hidden sm:block max-w-[100px] truncate">{user?.username}</span>
                                    {isAdmin && <span className="text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30 px-1.5 py-0.5 rounded-full font-semibold leading-none">ADMIN</span>}
                                </button>
                                <button onClick={handleLogout} title="Log out" className="text-gray-500 hover:text-red-400 transition p-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                </button>
                            </>
                        ) : (
                            <button onClick={() => navigate('/login')} className="text-sm bg-orange-500 hover:bg-orange-600 text-white px-4 py-1.5 rounded-full transition font-medium">Log In</button>
                        )}
                    </div>
                </div>
            </header>

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
                    <div className="flex items-center gap-3">
                        <select
                            value={filterCategoryId ?? ''}
                            onChange={e => setFilterCategoryId(e.target.value ? Number(e.target.value) : undefined)}
                            className="text-sm bg-[#2d2d2d] border border-white/20 rounded-lg px-3 py-1.5 text-gray-300 focus:outline-none focus:ring-1 focus:ring-orange-400"
                        >
                            <option value="">All categories</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        {isAuthenticated && (
                            <button
                                onClick={() => { setForm(emptyForm()); setShowModal(true); }}
                                className="text-sm bg-orange-500 text-white hover:bg-orange-600 px-4 py-1.5 rounded-xl transition font-semibold shadow-sm"
                            >+ Add Event</button>
                        )}
                    </div>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                    {(['EXAM', 'DEADLINE', 'LECTURE', 'OTHER'] as const).map(type => (
                        <span key={type} className={`text-xs px-2 py-0.5 rounded-full border ${EVENT_COLORS[type]}`}>{type}</span>
                    ))}
                </div>

                {/* Calendar grid */}
                {loading ? (
                    <p className="text-gray-400">Loading...</p>
                ) : (
                    <div className="rounded-xl border border-white/10 bg-[#2d2d2d] overflow-hidden">
                        <div className="grid grid-cols-7 border-b border-white/10">
                            {DAYS.map(d => (
                                <div key={d} className="text-center text-xs font-semibold text-gray-400 py-2">{d}</div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7">
                            {cells.map((day, idx) => {
                                if (!day) return <div key={`e-${idx}`} className="min-h-[90px] border-b border-r border-white/5" />;
                                const dayStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                const isToday = dayStr === todayStr;
                                const dayEvents = eventsByDay[day] || [];
                                return (
                                    <div
                                        key={day}
                                        className={`min-h-[90px] p-1.5 border-b border-r border-white/5 ${isToday ? 'bg-orange-500/5' : ''}`}
                                    >
                                        <span className={`text-xs font-medium mb-1 inline-flex items-center justify-center h-5 w-5 rounded-full ${isToday ? 'bg-orange-500 text-white' : 'text-gray-400'}`}>
                                            {day}
                                        </span>
                                        <div className="space-y-0.5">
                                            {dayEvents.slice(0, 3).map(ev => (
                                                <button
                                                    key={ev.id}
                                                    onClick={() => setSelectedEvent(ev)}
                                                    className={`w-full text-left text-xs px-1.5 py-0.5 rounded border truncate transition hover:opacity-80 ${EVENT_COLORS[ev.eventType]}`}
                                                    title={ev.title}
                                                >
                                                    {ev.title}
                                                </button>
                                            ))}
                                            {dayEvents.length > 3 && (
                                                <span className="text-xs text-gray-500 pl-1">+{dayEvents.length - 3} more</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </main>

            {/* Event detail modal */}
            {selectedEvent && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setSelectedEvent(null)}>
                    <div className="bg-[#2d2d2d] rounded-xl shadow-xl w-full max-w-md p-6 border border-white/10" onClick={e => e.stopPropagation()}>
                        <div className="flex items-start justify-between gap-4 mb-3">
                            <div>
                                <span className={`text-xs px-2 py-0.5 rounded-full border ${EVENT_COLORS[selectedEvent.eventType]}`}>{selectedEvent.eventType}</span>
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

            {/* Create event modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#2d2d2d] rounded-xl shadow-xl w-full max-w-md p-6 border border-white/10">
                        <h3 className="text-lg font-semibold text-gray-100 mb-4">Add Calendar Event</h3>
                        <form onSubmit={handleCreate} className="space-y-4">
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
                            <div className="flex justify-end gap-3 pt-1">
                                <button
                                    type="button"
                                    onClick={() => { setShowModal(false); setFormError(''); }}
                                    className="text-sm px-4 py-2 rounded-lg border border-white/20 text-gray-300 hover:bg-white/10 transition"
                                >Cancel</button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="text-sm px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium transition disabled:opacity-50"
                                >{saving ? 'Saving...' : 'Create'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
