import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getLeaderboard } from '../api/users';
import type { LeaderboardUser } from '../api/users';
import NavbarSearch from '../components/NavbarSearch';
import NotificationBell from '../components/NotificationBell';
import ChatIcon from '../components/ChatIcon';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function LeaderboardPage() {
    const navigate = useNavigate();
    const { user, logout, isAuthenticated } = useAuth();
    const [users, setUsers] = useState<LeaderboardUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getLeaderboard().then(setUsers).finally(() => setLoading(false));
    }, []);

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
                                {user?.role === 'ADMIN' && (
                                    <><button onClick={() => navigate('/admin')} className="text-sm text-orange-400 hover:text-orange-300 font-medium px-2 py-1 rounded-lg hover:bg-orange-500/10 transition">Admin</button><span className="w-px h-4 bg-white/20 mx-1" /></>
                                )}
                                <ChatIcon />
                                <NotificationBell />
                                <span className="w-px h-4 bg-white/20 mx-1" />
                                <button
                                    onClick={() => user?.username && navigate(`/profile/${user.username}`)}
                                    className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full pl-1.5 pr-3 py-1 transition"
                                >
                                    <span className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                                        {user?.username?.charAt(0).toUpperCase() ?? '?'}
                                    </span>
                                    <span className="text-sm text-gray-200 hidden sm:block max-w-[100px] truncate">{user?.username}</span>
                                    {user?.role === 'ADMIN' && <span className="text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30 px-1.5 py-0.5 rounded-full font-semibold leading-none">ADMIN</span>}
                                </button>
                                <button onClick={() => { logout(); navigate('/login'); }} title="Log out" className="text-gray-500 hover:text-red-400 transition p-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                </button>
                            </>
                        ) : (
                            <button onClick={() => navigate('/login')} className="text-sm bg-orange-500 hover:bg-orange-600 text-white px-4 py-1.5 rounded-full transition font-medium">
                                Log In
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-6">
                <h1 className="text-2xl font-bold text-gray-100 mb-5">Leaderboard</h1>
                {loading ? (
                    <p className="text-gray-400">Loading...</p>
                ) : (
                    <div className="space-y-2">
                        {users.map((u, i) => (
                            <div
                                key={u.id}
                                onClick={() => navigate(`/profile/${u.username}`)}
                                className="bg-[#343434] rounded-xl border border-white/10 px-5 py-3 flex items-center gap-4 cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition"
                            >
                                <span className="text-2xl w-8 text-center">{i < 3 ? MEDALS[i] : <span className="text-gray-400 font-bold text-base">#{i + 1}</span>}</span>
                                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center">
                                    <span className="text-white text-sm font-bold">{u.username.charAt(0).toUpperCase()}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-100 truncate">{u.username}</p>
                                    <p className="text-xs text-gray-400">Lv.{u.level} {u.levelTitle}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-orange-400">{u.reputation}</p>
                                    <p className="text-xs text-gray-400">rep</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
