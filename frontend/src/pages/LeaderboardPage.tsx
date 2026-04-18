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
                <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
                    <button
                        onClick={() => navigate('/')}
                        className="font-bold text-gray-100 hover:text-white text-xl leading-none transition cursor-pointer tracking-tight flex items-center gap-2"
                    >
                        <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                        TalkCS
                    </button>
                    <NavbarSearch />
                    <div className="flex items-center gap-3">
                        {isAuthenticated ? (
                            <>
                                <span className="text-sm text-gray-300 hidden sm:inline">{user?.email}</span>
                                {user?.role === 'ADMIN' && (
                                    <button onClick={() => navigate('/admin')} className="text-sm text-orange-400 hover:text-orange-300 transition font-medium">Admin</button>
                                )}
                                <ChatIcon />
                                <NotificationBell />
                                <button
                                    onClick={() => user?.username && navigate(`/profile/${user.username}`)}
                                    className="text-sm text-orange-500 hover:text-orange-400 transition"
                                >
                                    My Profile
                                </button>
                                <button onClick={() => { logout(); navigate('/login'); }} className="text-sm text-gray-300 hover:text-white transition">
                                    Log out
                                </button>
                            </>
                        ) : (
                            <button onClick={() => navigate('/login')} className="text-sm text-orange-500 hover:text-orange-400 transition">
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
