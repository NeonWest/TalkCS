import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getUserBadges } from '../api/badges';
import type { Badge } from '../api/badges';
import { ArrowLeft, Lock, Award, Star } from 'lucide-react';

const BADGE_ICONS: Record<string, string> = {
    'post1': '📝', 'post10': '✍️', 'post50': '📚', 'post100': '📜',
    'cmt1': '💬', 'cmt10': '🗣️', 'cmt50': '📣', 'cmt100': '📢',
    'rep50': '✨', 'rep200': '🛡️', 'rep500': '🏛️', 'rep1000': '💎',
    'accepted1': '✅'
};

function badgeIcon(key: string) { return BADGE_ICONS[key] ?? '🎖️'; }

export default function BadgesPage() {
    const { username } = useParams<{ username: string }>();
    const [badges, setBadges] = useState<Badge[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        if (username) {
            getUserBadges(username)
                .then(data => {
                    if (mounted) setBadges(data);
                })
                .finally(() => {
                    if (mounted) setLoading(false);
                });
        }
        return () => { mounted = false; };
    }, [username]);

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-12 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    const milestones = badges.filter(b => b.type === 'MILESTONE');
    const specials = badges.filter(b => b.type === 'SPECIAL');

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <Link to={`/profile/${username}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition mb-6">
                <ArrowLeft size={16} />
                Back to Profile
            </Link>

            <div className="mb-10">
                <h1 className="text-3xl font-bold text-foreground mb-2">{username}'s Achievements</h1>
                <p className="text-muted-foreground">Track progress and view all earned and locked badges.</p>
            </div>

            {/* Milestones Section */}
            <section className="mb-12">
                <div className="flex items-center gap-2 mb-6">
                    <Star className="text-primary" size={24} />
                    <h2 className="text-2xl font-bold text-foreground">Milestones</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {milestones.map(badge => (
                        <div 
                            key={badge.id} 
                            className={`bg-card rounded-2xl border border-border p-5 flex items-start gap-4 transition-all relative overflow-hidden group
                                ${!badge.earned ? 'opacity-50 grayscale hover:grayscale-0 hover:opacity-100' : 'hover:border-primary/50 shadow-sm'}`}
                        >
                            <div className="text-4xl shrink-0">
                                {badgeIcon(badge.iconKey)}
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-bold text-foreground truncate">{badge.name}</h3>
                                    {!badge.earned && <Lock size={12} className="text-muted-foreground" />}
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">{badge.description}</p>
                                {badge.earned && badge.awardedAt && (
                                    <p className="text-[10px] text-primary/70 mt-2 font-medium">
                                        Earned {new Date(badge.awardedAt).toLocaleDateString()}
                                    </p>
                                )}
                            </div>
                            {!badge.earned && (
                                <div className="absolute top-2 right-2">
                                    <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-bold tracking-wider">LOCKED</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* Expertise Section */}
            {specials.length > 0 && (
                <section>
                    <div className="flex items-center gap-2 mb-6">
                        <Award className="text-primary" size={24} />
                        <h2 className="text-2xl font-bold text-foreground">Special Achievements</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {specials.map(badge => {
                            const tier = badge.name.includes('Gold') ? 'Gold'
                                : badge.name.includes('Silver') ? 'Silver' : 'Bronze';
                            const tierColor = tier === 'Gold' ? 'text-yellow-400'
                                : tier === 'Silver' ? 'text-slate-300' : 'text-orange-400';
                            
                            return (
                                <div key={badge.id} className="bg-card rounded-2xl border border-border p-5 flex items-start gap-4 hover:border-primary/50 transition-all shadow-sm">
                                    <div className="text-4xl shrink-0">
                                        {tier === 'Gold' ? '🥇' : tier === 'Silver' ? '🥈' : '🥉'}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className={`font-bold ${tierColor} mb-1 truncate`}>{badge.name}</h3>
                                        <p className="text-xs text-muted-foreground leading-relaxed">{badge.description}</p>
                                        {badge.awardedAt && (
                                            <p className="text-[10px] text-primary/70 mt-2 font-medium">
                                                Earned {new Date(badge.awardedAt).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}
        </div>
    );
}
