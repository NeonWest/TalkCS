import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLeaderboard } from '../api/users';
import type { LeaderboardUser } from '../api/users';
import Navbar from '../components/Navbar';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function LeaderboardPage() {
    const navigate = useNavigate();
    const [users, setUsers] = useState<LeaderboardUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getLeaderboard().then(setUsers).finally(() => setLoading(false));
    }, []);

    return (
        <div className="min-h-screen bg-[#1f1f1f] text-gray-100">
            <Navbar />

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
