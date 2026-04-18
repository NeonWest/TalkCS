import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserProfile, getUserPosts, followUser, unfollowUser, updateProfile, uploadAvatar } from '../api/users';
import { getUserBookmarks } from '../api/posts';
import type { Post } from '../api/posts';
import { voteOnPost } from '../api/votes';
import { getUserBadges } from '../api/badges';
import type { UserProfile } from '../api/users';
import type { Badge } from '../api/badges';
import NavbarSearch from '../components/NavbarSearch';
import NotificationBell from '../components/NotificationBell';
import ChatIcon from '../components/ChatIcon';

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
    const { user, logout, isAuthenticated } = useAuth();

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

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleMyProfile = () => {
        if (!user?.username) return;
        navigate(`/profile/${user.username}`);
    };

    return (
        <div className="min-h-screen bg-[#1f1f1f] text-gray-100">
            <header className="bg-[#323232] shadow-sm sticky top-0 z-50 border-b border-white/10">
                <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/')}
                            className="font-bold text-gray-100 hover:text-white text-xl leading-none transition cursor-pointer tracking-tight flex items-center gap-2"
                        >
                            <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                            TalkCS
                        </button>
                    </div>
                    <NavbarSearch />
                    <div className="flex items-center gap-3">
                        {isAuthenticated ? (
                            <>
                                <span className="text-sm text-gray-300 hidden sm:inline">{user?.email}</span>
                                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold">{user?.role}</span>
                                <ChatIcon />
                                <NotificationBell />
                                <button
                                    onClick={handleMyProfile}
                                    disabled={!user?.username}
                                    className="text-sm text-orange-500 hover:text-orange-400 transition disabled:opacity-50"
                                >
                                    My Profile
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="text-sm text-gray-300 hover:text-white transition"
                                >
                                    Log out
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => navigate('/login')}
                                className="text-sm text-orange-500 hover:text-orange-400 transition"
                            >
                                Log In
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
                {loading ? (
                    <p className="text-base text-gray-400">Loading...</p>
                ) : error ? (
                    <p className="text-base text-red-500">{error}</p>
                ) : !profile ? (
                    <p className="text-base text-red-500">Profile not found.</p>
                ) : (
                    <>
                        {/* Profile Header */}
                        <div className="bg-[#343434] rounded-xl shadow-sm p-5 space-y-4 border border-white/10">
                            <div className="flex items-start gap-6">
                                {/* Avatar */}
                                <div className="flex-shrink-0">
                                    {profile.avatarUrl ? (
                                        <img
                                            src={`http://localhost:8080${profile.avatarUrl}`}
                                            alt={profile.username}
                                            className="w-14 h-14 rounded-full object-cover border-2 border-orange-500/30"
                                        />
                                    ) : (
                                        <div className="w-14 h-14 rounded-full bg-orange-500 flex items-center justify-center">
                                            <span className="text-white text-lg font-bold">{profile.username.charAt(0).toUpperCase()}</span>
                                        </div>
                                    )}
                                </div>
                                {/* Profile Info */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                        <h1 className="text-2xl font-bold text-gray-100">{profile.username}</h1>
                                        {user?.username === profile.username && (
                                            <button
                                                onClick={() => { setEditBio(profile.bio ?? ''); setEditAvatarFile(null); setShowEditModal(true); }}
                                                className="text-xs text-orange-400 hover:text-orange-300 border border-orange-500/30 px-2 py-0.5 rounded-lg transition"
                                            >
                                                Edit Profile
                                            </button>
                                        )}
                                    </div>
                                    {profile.bio && (
                                        <p className="text-sm text-gray-400 mt-1">{profile.bio}</p>
                                    )}
                                    <div className="mt-2 flex items-center gap-3 flex-wrap">
                                        <span className="inline-block text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-semibold">{profile.role}</span>
                                        <span className="inline-block text-xs bg-orange-500/20 text-orange-300 px-3 py-1 rounded-full font-semibold">Lv.{profile.level} {profile.levelTitle}</span>
                                        <span className="text-gray-300 text-sm">Joined {new Date(profile.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    {/* Progress bar toward next level */}
                                    {profile.nextLevelRepRequired !== null && (
                                        <div className="mt-3">
                                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                                                <span>{profile.reputation} rep</span>
                                                <span>{profile.nextLevelRepRequired} for next level</span>
                                            </div>
                                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-orange-500 rounded-full transition-all"
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
                                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition disabled:opacity-50 ${following ? 'bg-white/10 text-gray-300 hover:bg-white/20' : 'bg-orange-500 hover:bg-orange-600 text-white'}`}
                                    >
                                        {followLoading ? '...' : following ? 'Unfollow' : 'Follow'}
                                    </button>
                                    <span className="text-sm text-gray-400">{followerCount} follower{followerCount !== 1 ? 's' : ''}</span>
                                    <span className="text-sm text-gray-400">{profile.followingCount} following</span>
                                </div>
                            )}
                            {(user?.username === profile.username) && (
                                <div className="flex gap-4 pt-2">
                                    <span className="text-sm text-gray-400">{followerCount} follower{followerCount !== 1 ? 's' : ''}</span>
                                    <span className="text-sm text-gray-400">{profile.followingCount} following</span>
                                </div>
                            )}
                            {/* Stats Row */}
                            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
                                <div className="bg-[#2b2b2b] rounded-xl p-3 text-center border border-white/10">
                                    <div className="text-2xl font-bold text-gray-100">{profile.postCount}</div>
                                    <div className="text-xs text-gray-300 mt-1">Posts</div>
                                </div>
                                <div className="bg-[#2b2b2b] rounded-xl p-3 text-center border border-white/10">
                                    <div className="text-2xl font-bold text-gray-100">{profile.commentCount ?? 0}</div>
                                    <div className="text-xs text-gray-300 mt-1">Comments</div>
                                </div>
                                <div className="bg-[#2b2b2b] rounded-xl p-3 text-center border border-white/10">
                                    <div className="text-base text-gray-100 font-semibold">{profile.reputation ?? 0}</div>
                                    <div className="text-xs text-gray-300 mt-1">Reputation</div>
                                </div>
                            </div>
                        </div>

                        {/* Milestone Badges */}
                        {badges.filter(b => b.type === 'MILESTONE').length > 0 && (
                            <div>
                                <h2 className="text-xl font-bold text-gray-200 mb-3 tracking-wide">Badges</h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {badges.filter(b => b.type === 'MILESTONE').map(badge => (
                                        <div key={badge.id} className="bg-[#2b2b2b] rounded-xl border border-white/10 px-4 py-3 flex items-start gap-3">
                                            <span className="text-2xl">{badgeIcon(badge.iconKey)}</span>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-100">{badge.name}</p>
                                                <p className="text-xs text-gray-400">{badge.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Expertise Badges */}
                        {badges.filter(b => b.type === 'SPECIAL').length > 0 && (
                            <div>
                                <h2 className="text-xl font-bold text-gray-200 mb-3 tracking-wide">Expertise</h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {badges.filter(b => b.type === 'SPECIAL').map(badge => {
                                        const tier = badge.name.includes('Gold') ? 'Gold'
                                            : badge.name.includes('Silver') ? 'Silver' : 'Bronze';
                                        const tierColor = tier === 'Gold' ? 'text-yellow-400'
                                            : tier === 'Silver' ? 'text-gray-300' : 'text-orange-400';
                                        return (
                                            <div key={badge.id} className="bg-[#2b2b2b] rounded-xl border border-white/10 px-4 py-3 flex items-start gap-3">
                                                <span className="text-2xl">{tier === 'Gold' ? '🥇' : tier === 'Silver' ? '🥈' : '🥉'}</span>
                                                <div>
                                                    <p className={`text-sm font-semibold ${tierColor}`}>{badge.name}</p>
                                                    <p className="text-xs text-gray-400">{badge.description}</p>
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
                                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${activeTab === tab ? 'bg-orange-500 text-white' : 'border border-white/20 text-gray-300 hover:bg-white/10'}`}>
                                        {tab === 'posts' ? 'Recent Posts' : 'Saved Posts'}
                                    </button>
                                ))}
                            </div>
                            {(() => {
                                const list = activeTab === 'posts' ? posts : bookmarks;
                                if (list.length === 0) return (
                                    <div className="bg-[#101010] rounded-xl shadow-sm p-12 text-center text-gray-400 border border-white/10">
                                        {activeTab === 'posts' ? 'No posts yet.' : 'No saved posts.'}
                                    </div>
                                );
                                return (
                                    <div className="space-y-3">
                                        {list.map(post => (
                                            <div key={post.id} onClick={() => navigate(`/post/${post.id}`)}
                                                className="bg-[#343434] rounded-xl shadow-sm border border-white/10 px-4 py-3 hover:shadow-md hover:-translate-y-0.5 transition cursor-pointer">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-lg font-semibold text-orange-500 truncate">{post.title}</p>
                                                        <p className="text-sm text-gray-300 mt-1">
                                                            {new Date(post.createdAt).toLocaleDateString()}
                                                            <span className="mx-3">•</span>
                                                            {post.commentCount} comment{post.commentCount !== 1 ? 's' : ''}
                                                        </p>
                                                    </div>
                                                    {isAuthenticated && activeTab === 'posts' && (
                                                        <div className="flex items-center gap-1 shrink-0">
                                                            <button onClick={async (e) => { e.stopPropagation(); setVotingPostId(post.id); try { await voteOnPost(post.id, 1); if (username) await refreshUserPosts(username); } finally { setVotingPostId(null); } }}
                                                                disabled={votingPostId === post.id}
                                                                className={`text-sm transition ${post.userVote === 1 ? 'text-orange-400' : 'text-gray-400 hover:text-gray-200'} disabled:opacity-50`}>▲</button>
                                                            <span className="text-sm font-semibold text-gray-200 w-6 text-center">{post.voteScore ?? 0}</span>
                                                            <button onClick={async (e) => { e.stopPropagation(); setVotingPostId(post.id); try { await voteOnPost(post.id, -1); if (username) await refreshUserPosts(username); } finally { setVotingPostId(null); } }}
                                                                disabled={votingPostId === post.id}
                                                                className={`text-sm transition ${post.userVote === -1 ? 'text-blue-400' : 'text-gray-400 hover:text-gray-200'} disabled:opacity-50`}>▼</button>
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
                    <div className="bg-[#2d2d2d] rounded-xl border border-white/10 shadow-xl w-full max-w-md p-6 space-y-4">
                        <h2 className="text-lg font-semibold text-gray-100">Edit Profile</h2>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Bio</label>
                            <textarea
                                value={editBio}
                                onChange={e => setEditBio(e.target.value)}
                                rows={3}
                                placeholder="Tell others about yourself…"
                                className="w-full bg-[#1a1a1a] text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm border border-white/10 focus:outline-none focus:border-orange-500/50 resize-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Avatar</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={e => setEditAvatarFile(e.target.files?.[0] ?? null)}
                                className="text-sm text-gray-400 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-orange-500 file:text-white hover:file:bg-orange-600 cursor-pointer"
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
                                className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium transition"
                            >
                                {editSaving ? 'Saving…' : 'Save'}
                            </button>
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition"
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
