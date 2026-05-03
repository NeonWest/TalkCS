import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLeaderboard } from '../api/users';
import type { LeaderboardUser } from '../api/users';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function LeaderboardPage() {
    const navigate = useNavigate();
    const [users, setUsers] = useState<LeaderboardUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getLeaderboard().then(setUsers).finally(() => setLoading(false));
    }, []);

    return (
        <div className="min-h-screen bg-background text-foreground">

            <main className="max-w-4xl mx-auto px-4 py-6">
                <h1 className="text-2xl font-bold text-foreground mb-5">Leaderboard</h1>
                {loading ? (
                    <p className="text-muted-foreground">Loading...</p>
                ) : (
                    <div className="space-y-2">
                        {users.map((u, i) => (
                            <div
                                key={u.id}
                                onClick={() => navigate(`/profile/${u.username}`)}
                                className="bg-card rounded-xl border border-border px-3 sm:px-5 py-3 flex items-center gap-3 sm:gap-4 cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition"
                            >
                                <span className="text-xl sm:text-2xl w-6 sm:w-8 text-center shrink-0">{i < 3 ? MEDALS[i] : <span className="text-muted-foreground font-bold text-sm sm:text-base">#{i + 1}</span>}</span>
                                <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/10">
                                    <span className="text-primary-foreground text-xs sm:text-sm font-bold">{u.username.charAt(0).toUpperCase()}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-foreground text-sm sm:text-base truncate">{u.username}</p>
                                    <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">Lv.{u.level} {u.levelTitle}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="font-bold text-primary text-sm sm:text-base">{u.reputation}</p>
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">rep</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
