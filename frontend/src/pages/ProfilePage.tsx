import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { getUserProfile, getUserPosts, followUser, unfollowUser, updateProfile, uploadAvatar } from '../api/users';
import { getUserBookmarks } from '../api/posts';
import type { Post } from '../api/posts';
import { voteOnPost } from '../api/votes';
import { getUserBadges } from '../api/badges';
import type { UserProfile } from '../api/users';
import type { Badge } from '../api/badges';
import Navbar from '../components/Navbar';

const BADGE_ICONS: Record<string, string> = {
    post1: '📝', post10: '✍️', post50: '🖊️', post100: '📚',
    cmt1: '💬', cmt10: '🗣️', cmt50: '💭', cmt100: '🎙️',
    rep50: '⭐', rep200: '🌟', rep500: '🏅', rep1000: '🏆',
    accepted1: '✅',
};
function badgeIcon(key: string) { return BADGE_ICONS[key] ?? '🎖️'; }

export default function ProfilePage() {
    const { username } = useParams<{ username: string }>();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [votingPostId, setVotingPostId] = useState<number | null>(null);
    const [badges, setBadges] = useState<Badge[]>([]);
    const [bookmarks, setBookmarks] = useState<Post[]>([]);
    const [activeTab, setActiveTab] = useState<'posts' | 'saved'>('posts');
    const [following, setFollowing] = useState(false);
    const [followerCount, setFollowerCount] = useState(0);
    const [followLoading, setFollowLoading] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editBio, setEditBio] = useState('');
    const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null);
    const [editSaving, setEditSaving] = useState(false);

    const refreshUserPosts = async (targetUsername: string) => {
        const updated = await getUserPosts(targetUsername);
        setPosts(updated);
    };

    useEffect(() => {
        if (!username) {
            setError('Invalid profile username.');
            setLoading(false);
            return;
        }

        setError('');
        setLoading(true);
        Promise.all([
            getUserProfile(username).then(p => {
                setProfile(p);
                setFollowing(p.followedByCurrentUser);
                setFollowerCount(p.followerCount);
            }),
            getUserPosts(username).then(setPosts),
            getUserBadges(username).then(setBadges),
            getUserBookmarks(username).then(setBookmarks),
        ])
            .catch(() => setError('Failed to load profile.'))
            .finally(() => setLoading(false));
    }, [username]);

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />

            <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
                {loading ? (
                    <p className="text-base text-muted-foreground">Loading...</p>
                ) : error ? (
                    <p className="text-base text-destructive">{error}</p>
                ) : !profile ? (
                    <p className="text-base text-destructive">Profile not found.</p>
                ) : (
                    <>
                        {/* Profile Header */}
                        <div className="bg-card rounded-xl shadow-sm p-5 space-y-4 border border-border">
                            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                                {/* Avatar */}
                                <div className="flex-shrink-0">
                                    {profile.avatarUrl ? (
                                        <img
                                            src={`http://localhost:8080${profile.avatarUrl}`}
                                            alt={profile.username}
                                            className="w-16 h-16 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-primary/30"
                                        />
                                    ) : (
                                        <div className="w-16 h-16 sm:w-14 sm:h-14 rounded-full bg-primary flex items-center justify-center">
                                            <span className="text-primary-foreground text-xl sm:text-lg font-bold">{profile.username.charAt(0).toUpperCase()}</span>
                                        </div>
                                    )}
                                </div>
                                {/* Profile Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3">
                                        <h1 className="text-2xl font-bold text-foreground truncate">{profile.username}</h1>
                                        {user?.username === profile.username && (
                                            <button
                                                onClick={() => { setEditBio(profile.bio ?? ''); setEditAvatarFile(null); setShowEditModal(true); }}
                                                className="text-xs text-primary hover:text-primary/80 border border-primary/30 px-2 py-0.5 rounded-lg transition shrink-0"
                                            >
                                                Edit Profile
                                            </button>
                                        )}
                                    </div>
                                    {profile.bio && (
                                        <p className="text-sm text-muted-foreground mt-1">{profile.bio}</p>
                                    )}
                                    <div className="mt-2 flex items-center gap-3 flex-wrap">
                                        <span className="inline-block text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-semibold">{profile.role}</span>
                                        <span className="inline-block text-xs bg-primary/20 text-primary px-3 py-1 rounded-full font-semibold">Lv.{profile.level} {profile.levelTitle}</span>
                                        <span className="text-muted-foreground text-sm">Joined {new Date(profile.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    {/* Progress bar toward next level */}
                                    {profile.nextLevelRepRequired !== null && (
                                        <div className="mt-3">
                                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                                <span>{profile.reputation} rep</span>
                                                <span>{profile.nextLevelRepRequired} for next level</span>
                                            </div>
                                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary rounded-full transition-all"
                                                    style={{ width: `${Math.min(100, (profile.reputation / profile.nextLevelRepRequired) * 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {/* Follow button */}
                            {isAuthenticated && user?.username !== profile.username && (
                                <div className="flex items-center gap-4 pt-2">
                                    <button
                                        onClick={async () => {
                                            setFollowLoading(true);
                                            try {
                                                if (following) {
                                                    await unfollowUser(profile.username);
                                                    setFollowing(false);
                                                    setFollowerCount(c => c - 1);
                                                } else {
                                                    await followUser(profile.username);
                                                    setFollowing(true);
                                                    setFollowerCount(c => c + 1);
                                                }
                                            } finally { setFollowLoading(false); }
                                        }}
                                        disabled={followLoading}
                                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition disabled:opacity-50 ${following ? 'bg-muted text-muted-foreground hover:bg-muted/70' : 'bg-primary hover:bg-primary/90 text-primary-foreground'}`}
                                    >
                                        {followLoading ? '...' : following ? 'Unfollow' : 'Follow'}
                                    </button>
                                    <span className="text-sm text-muted-foreground">{followerCount} follower{followerCount !== 1 ? 's' : ''}</span>
                                    <span className="text-sm text-muted-foreground">{profile.followingCount} following</span>
                                </div>
                            )}
                            {(user?.username === profile.username) && (
                                <div className="flex gap-4 pt-2">
                                    <span className="text-sm text-muted-foreground">{followerCount} follower{followerCount !== 1 ? 's' : ''}</span>
                                    <span className="text-sm text-muted-foreground">{profile.followingCount} following</span>
                                </div>
                            )}
                            {/* Stats Row */}
                            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
                                <div className="bg-card rounded-xl p-3 text-center border border-border">
                                    <div className="text-2xl font-bold text-foreground">{profile.postCount}</div>
                                    <div className="text-xs text-muted-foreground mt-1">Posts</div>
                                </div>
                                <div className="bg-card rounded-xl p-3 text-center border border-border">
                                    <div className="text-2xl font-bold text-foreground">{profile.commentCount ?? 0}</div>
                                    <div className="text-xs text-muted-foreground mt-1">Comments</div>
                                </div>
                                <div className="bg-card rounded-xl p-3 text-center border border-border">
                                    <div className="text-base text-foreground font-semibold">{profile.reputation ?? 0}</div>
                                    <div className="text-xs text-muted-foreground mt-1">Reputation</div>
                                </div>
                            </div>
                        </div>

                        {/* Milestone Badges */}
                        {badges.filter(b => b.type === 'MILESTONE').length > 0 && (
                            <div>
                                <h2 className="text-xl font-bold text-foreground mb-3 tracking-wide">Badges</h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {badges.filter(b => b.type === 'MILESTONE').map(badge => (
                                        <div key={badge.id} className="bg-card rounded-xl border border-border px-4 py-3 flex items-start gap-3">
                                            <span className="text-2xl">{badgeIcon(badge.iconKey)}</span>
                                            <div>
                                                <p className="text-sm font-semibold text-foreground">{badge.name}</p>
                                                <p className="text-xs text-muted-foreground">{badge.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Expertise Badges */}
                        {badges.filter(b => b.type === 'SPECIAL').length > 0 && (
                            <div>
                                <h2 className="text-xl font-bold text-foreground mb-3 tracking-wide">Expertise</h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {badges.filter(b => b.type === 'SPECIAL').map(badge => {
                                        const tier = badge.name.includes('Gold') ? 'Gold'
                                            : badge.name.includes('Silver') ? 'Silver' : 'Bronze';
                                        const tierColor = tier === 'Gold' ? 'text-yellow-400'
                                            : tier === 'Silver' ? 'text-muted-foreground' : 'text-primary';
                                        return (
                                            <div key={badge.id} className="bg-card rounded-xl border border-border px-4 py-3 flex items-start gap-3">
                                                <span className="text-2xl">{tier === 'Gold' ? '🥇' : tier === 'Silver' ? '🥈' : '🥉'}</span>
                                                <div>
                                                    <p className={`text-sm font-semibold ${tierColor}`}>{badge.name}</p>
                                                    <p className="text-xs text-muted-foreground">{badge.description}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Posts / Saved Tabs */}
                        <div>
                            <div className="flex gap-2 mb-3">
                                {(['posts', 'saved'] as const).map(tab => (
                                    <button key={tab} onClick={() => setActiveTab(tab)}
                                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${activeTab === tab ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground hover:bg-accent/50'}`}>
                                        {tab === 'posts' ? 'Recent Posts' : 'Saved Posts'}
                                    </button>
                                ))}
                            </div>
                            {(() => {
                                const list = activeTab === 'posts' ? posts : bookmarks;
                                if (list.length === 0) return (
                                    <div className="bg-background rounded-xl shadow-sm p-12 text-center text-muted-foreground border border-border">
                                        {activeTab === 'posts' ? 'No posts yet.' : 'No saved posts.'}
                                    </div>
                                );
                                return (
                                    <div className="space-y-3">
                                        {list.map(post => (
                                            <div key={post.id} onClick={() => navigate(`/post/${post.id}`)}
                                                className="bg-card rounded-xl shadow-sm border border-border px-4 py-3 hover:shadow-md hover:-translate-y-0.5 transition cursor-pointer">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-lg font-semibold text-primary truncate">{post.title}</p>
                                                        <p className="text-sm text-muted-foreground mt-1">
                                                            {new Date(post.createdAt).toLocaleDateString()}
                                                            <span className="mx-3">•</span>
                                                            {post.commentCount} comment{post.commentCount !== 1 ? 's' : ''}
                                                        </p>
                                                    </div>
                                                    {isAuthenticated && activeTab === 'posts' && (
                                                        <div className="flex items-center gap-1 shrink-0">
                                                            <button onClick={async (e) => { e.stopPropagation(); setVotingPostId(post.id); try { await voteOnPost(post.id, 1); if (username) await refreshUserPosts(username); } finally { setVotingPostId(null); } }}
                                                                disabled={votingPostId === post.id}
                                                                className={`text-sm transition ${post.userVote === 1 ? 'text-primary' : 'text-muted-foreground hover:text-foreground'} disabled:opacity-50`}>▲</button>
                                                            <span className="text-sm font-semibold text-foreground w-6 text-center">{post.voteScore ?? 0}</span>
                                                            <button onClick={async (e) => { e.stopPropagation(); setVotingPostId(post.id); try { await voteOnPost(post.id, -1); if (username) await refreshUserPosts(username); } finally { setVotingPostId(null); } }}
                                                                disabled={votingPostId === post.id}
                                                                className={`text-sm transition ${post.userVote === -1 ? 'text-blue-400' : 'text-muted-foreground hover:text-foreground'} disabled:opacity-50`}>▼</button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                        </div>
                    </>
                )}
            </main>

            {/* Edit Profile Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-xl border border-border shadow-xl w-full max-w-md p-6 space-y-4">
                        <h2 className="text-lg font-semibold text-foreground">Edit Profile</h2>

                        <div>
                            <label className="block text-sm text-muted-foreground mb-1">Bio</label>
                            <textarea
                                value={editBio}
                                onChange={e => setEditBio(e.target.value)}
                                rows={3}
                                placeholder="Tell others about yourself…"
                                className="w-full bg-popover text-foreground placeholder:text-muted-foreground rounded-lg px-3 py-2 text-sm border border-border focus:outline-none focus:border-primary/50 resize-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-muted-foreground mb-1">Avatar</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={e => setEditAvatarFile(e.target.files?.[0] ?? null)}
                                className="text-sm text-muted-foreground file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-primary file:text-white hover:file:bg-primary/90 cursor-pointer"
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={async () => {
                                    setEditSaving(true);
                                    try {
                                        let updated = await updateProfile(editBio);
                                        if (editAvatarFile) await uploadAvatar(editAvatarFile);
                                        if (username) {
                                            updated = await import('../api/users').then(m => m.getUserProfile(username));
                                        }
                                        setProfile(updated);
                                        setShowEditModal(false);
                                    } finally { setEditSaving(false); }
                                }}
                                disabled={editSaving}
                                className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium transition"
                            >
                                {editSaving ? 'Saving…' : 'Save'}
                            </button>
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
