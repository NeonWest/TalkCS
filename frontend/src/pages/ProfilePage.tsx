import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserProfile, getUserPosts } from '../api/users';
import type { UserProfile } from '../api/users';
import type { Post } from '../api/posts';

export default function ProfilePage() {
    const { username } = useParams<{ username: string }>();
    const navigate = useNavigate();
    const { user, logout } = useAuth();

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
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-5xl mx-auto px-4 h-12 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/')}
                            className="font-bold text-gray-800 hover:text-gray-900 text-lg transition cursor-pointer"
                        >
                            TalkCS
                        </button>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600">{user?.email}</span>
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-medium">{user?.role}</span>
                        <button
                            onClick={handleMyProfile}
                            disabled={!user?.username}
                            className="text-sm text-blue-500 hover:text-blue-700 transition disabled:opacity-50"
                        >
                            My Profile
                        </button>
                        <button
                            onClick={handleLogout}
                            className="text-sm text-gray-500 hover:text-gray-800 transition"
                        >
                            Log out
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
                {loading ? (
                    <p className="text-sm text-gray-400">Loading...</p>
                ) : error ? (
                    <p className="text-sm text-red-500">{error}</p>
                ) : !profile ? (
                    <p className="text-sm text-red-500">Profile not found.</p>
                ) : (
                    <>
                        <div className="bg-white border border-gray-200 rounded p-6">
                            <h1 className="text-xl font-semibold text-gray-800">{profile.username}</h1>
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-medium">{profile.role}</span>
                                <span>Joined {new Date(profile.createdAt).toLocaleDateString()}</span>
                                <span>•</span>
                                <span>{profile.postCount} post{profile.postCount !== 1 ? 's' : ''}</span>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-base font-semibold text-gray-800 mb-2">
                                Posts ({posts.length})
                            </h2>
                            {posts.length === 0 ? (
                                <div className="bg-white border border-gray-200 rounded p-8 text-center text-gray-400 text-sm">
                                    No posts yet.
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-200 border border-gray-200 rounded bg-white">
                                    {posts.map(post => (
                                        <div
                                            key={post.id}
                                            onClick={() => navigate(`/post/${post.id}`)}
                                            className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50 transition cursor-pointer"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-blue-600 hover:text-blue-800 truncate">{post.title}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">{post.commentCount} comment{post.commentCount !== 1 ? 's' : ''}</p>
                                            </div>
                                            <span className="text-xs text-gray-400 whitespace-nowrap mt-0.5">
                                                {new Date(post.createdAt).toLocaleDateString()}
                                            </span>
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
