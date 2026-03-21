import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserProfile, getUserPosts } from '../api/users';
import type { UserProfile } from '../api/users';
import type { Post } from '../api/posts';

export default function ProfilePage() {
    const { username } = useParams<{ username: string }>();
    const navigate = useNavigate();
    const { user, logout, isAuthenticated } = useAuth();

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!username) {
            setError('Invalid profile username.');
            setLoading(false);
            return;
        }

        setError('');
        setLoading(true);
        Promise.all([
            getUserProfile(username).then(setProfile),
            getUserPosts(username).then(setPosts),
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
                    <div className="flex items-center gap-3">
                        {isAuthenticated ? (
                            <>
                                <span className="text-sm text-gray-300 hidden sm:inline">{user?.email}</span>
                                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold">{user?.role}</span>
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
                                {/* Avatar Circle */}
                                <div className="flex-shrink-0">
                                    <div className="w-14 h-14 rounded-full bg-orange-500 flex items-center justify-center">
                                        <span className="text-white text-lg font-bold">{profile.username.charAt(0).toUpperCase()}</span>
                                    </div>
                                </div>
                                {/* Profile Info */}
                                <div className="flex-1">
                                    <h1 className="text-2xl font-bold text-gray-100">{profile.username}</h1>
                                    <div className="mt-2 flex items-center gap-3 flex-wrap">
                                        <span className="inline-block text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-semibold">{profile.role}</span>
                                        <span className="text-gray-300 text-sm">Joined {new Date(profile.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                            {/* Stats Row */}
                            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
                                <div className="bg-[#2b2b2b] rounded-xl p-3 text-center border border-white/10">
                                    <div className="text-2xl font-bold text-gray-100">{profile.postCount}</div>
                                    <div className="text-xs text-gray-300 mt-1">Posts</div>
                                </div>
                                <div className="bg-[#2b2b2b] rounded-xl p-3 text-center border border-white/10">
                                    <div className="text-2xl font-bold text-gray-100">{posts.reduce((sum, p) => sum + (p.commentCount || 0), 0)}</div>
                                    <div className="text-xs text-gray-300 mt-1">Comments</div>
                                </div>
                                <div className="bg-[#2b2b2b] rounded-xl p-3 text-center border border-white/10">
                                    <div className="text-base text-gray-100 font-semibold capitalize">{profile.role}</div>
                                    <div className="text-xs text-gray-300 mt-1">Role</div>
                                </div>
                            </div>
                        </div>

                        {/* Posts Section */}
                        <div>
                            <h2 className="text-xl font-bold text-gray-200 mb-3 tracking-wide">
                                Recent posts
                            </h2>
                            {posts.length === 0 ? (
                                <div className="bg-[#101010] rounded-xl shadow-sm p-12 text-center text-gray-400 border border-white/10">
                                    No posts yet.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {posts.map(post => (
                                        <div
                                            key={post.id}
                                            onClick={() => navigate(`/post/${post.id}`)}
                                            className="bg-[#343434] rounded-xl shadow-sm border border-white/10 px-4 py-3 hover:shadow-md hover:-translate-y-0.5 transition cursor-pointer"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-lg font-semibold text-orange-500 truncate">{post.title}</p>
                                                    <p className="text-sm text-gray-300 mt-1">
                                                        General
                                                        <span className="mx-3">•</span>
                                                        {new Date(post.createdAt).toLocaleDateString()}
                                                        <span className="mx-3">•</span>
                                                        {post.commentCount} comment{post.commentCount !== 1 ? 's' : ''}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
