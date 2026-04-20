import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNotifications, getUnreadCount, markRead, markAllRead } from '../api/notifications';
import type { NotificationItem } from '../api/notifications';

const TYPE_ICON: Record<string, string> = {
    MENTION: '💬', REPLY: '↩️', VOTE_MILESTONE: '⭐', ACCEPTED_ANSWER: '✅', FOLLOW: '👤',
};

export default function NotificationBell() {
    const navigate = useNavigate();
    const [count, setCount] = useState(0);
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState<NotificationItem[]>([]);
    const ref = useRef<HTMLDivElement>(null);

    const fetchCount = async () => { try { setCount(await getUnreadCount()); } catch {} };

    useEffect(() => {
        fetchCount();
        const id = setInterval(fetchCount, 30000);
        return () => clearInterval(id);
    }, []);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleOpen = async () => {
        if (!open) {
            try { setItems(await getNotifications()); } catch {}
        }
        setOpen(o => !o);
    };

    const handleClick = async (item: NotificationItem) => {
        if (!item.isRead) {
            await markRead(item.id);
            setItems(prev => prev.map(n => n.id === item.id ? { ...n, isRead: true } : n));
            setCount(c => Math.max(0, c - 1));
        }
        setOpen(false);
        navigate(item.link);
    };

    const handleMarkAll = async () => {
        await markAllRead();
        setItems(prev => prev.map(n => ({ ...n, isRead: true })));
        setCount(0);
    };

    return (
        <div ref={ref} className="relative">
            <button onClick={handleOpen} className="relative text-gray-300 hover:text-white transition p-1">
                <span className="text-lg">🔔</span>
                {count > 0 && (
                    <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                        {count > 9 ? '9+' : count}
                    </span>
                )}
            </button>

            {open && (
                <div className="fixed sm:absolute right-0 sm:right-0 top-14 sm:top-auto sm:mt-2 w-screen sm:w-80 h-[calc(100vh-3.5rem)] sm:h-auto bg-[#2d2d2d] border-t sm:border border-white/10 sm:rounded-xl shadow-xl z-50 overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between px-4 py-3 sm:py-2 border-b border-white/10 shrink-0">
                        <span className="text-sm font-semibold text-gray-200">Notifications</span>
                        <div className="flex items-center gap-4">
                            {count > 0 && (
                                <button onClick={handleMarkAll} className="text-xs text-orange-400 hover:text-orange-300 transition">
                                    Mark all read
                                </button>
                            )}
                            <button onClick={() => setOpen(false)} className="sm:hidden text-gray-400 hover:text-white">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {items.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-12">No notifications</p>
                        ) : (
                            items.map(item => (
                                <button key={item.id} onClick={() => void handleClick(item)}
                                    className={`w-full text-left px-4 py-4 sm:py-3 flex gap-3 items-start hover:bg-white/5 transition border-b border-white/5 last:border-0 ${!item.isRead ? 'bg-orange-500/5' : ''}`}>
                                    <span className="text-lg sm:text-base shrink-0 mt-0.5">{TYPE_ICON[item.type] ?? '🔔'}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm sm:text-xs leading-snug ${item.isRead ? 'text-gray-400' : 'text-gray-200 font-medium'}`}>{item.message}</p>
                                        <p className="text-xs text-gray-500 mt-1">{new Date(item.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    {!item.isRead && <span className="w-2.5 h-2.5 sm:w-2 sm:h-2 rounded-full bg-orange-500 shrink-0 mt-1.5" />}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
