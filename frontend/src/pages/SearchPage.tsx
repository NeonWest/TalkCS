import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { search } from '../api/search';
import type { SearchResponse } from '../api/search';
import NavbarSearch from '../components/NavbarSearch';
import NotificationBell from '../components/NotificationBell';
import ChatIcon from '../components/ChatIcon';

export default function SearchPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout, isAuthenticated } = useAuth();
    const query = new URLSearchParams(location.search).get('q') ?? '';

    const [results, setResults] = useState<SearchResponse>({ posts: [], categories: [], users: [] });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const trimmed = query.trim();
        if (!trimmed) {
            setResults({ posts: [], categories: [], users: [] });
            return;
        }

        setError('');
        setLoading(true);
        search(trimmed)
            .then(setResults)
            .catch(() => setError('Failed to load search results.'))
            .finally(() => setLoading(false));
    }, [query]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleMyProfile = () => {
        if (!user?.username) return;
        navigate(`/profile/${user.username}`);
    };

    const totalResults = results.posts.length + results.categories.length + results.users.length;

    return (
        <div className="min-h-screen bg-[#1f1f1f] text-gray-100">
            <header className="bg-[#323232] shadow-sm sticky top-0 z-50 border-b border-white/10">
                <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
                    <button
                        onClick={() => navigate('/')}
                        className="font-bold text-gray-100 hover:text-white text-xl leading-none transition cursor-pointer tracking-tight flex items-center gap-2 shrink-0"
                    >
                        <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                        TalkCS
                    </button>

                    <NavbarSearch />

                    <div className="flex items-center gap-3 shrink-0">
                        {isAuthenticated ? (
                            <>
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

            <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">Search</h1>
                    <p className="text-sm text-gray-300 mt-1">
                        {query.trim() ? `Results for "${query}"` : 'Enter a keyword in the navbar search box.'}
                    </p>
                </div>

                {error && <p className="text-sm text-red-400">{error}</p>}
                {loading && <p className="text-sm text-gray-400">Searching...</p>}
                {!loading && query.trim() && totalResults === 0 && (
                    <div className="bg-[#101010] rounded-xl shadow-sm p-8 text-center text-gray-400 border border-white/10">
                        No results found.
                    </div>
                )}

                {!loading && query.trim() && totalResults > 0 && (
                    <>
                        <section className="space-y-3">
                            <h2 className="text-lg font-semibold text-orange-400">Posts</h2>
                            {results.posts.length === 0 ? (
                                <p className="text-sm text-gray-400">No matching posts.</p>
                            ) : (
                                <div className="space-y-2">
                                    {results.posts.map((post) => (
                                        <button
                                            key={post.id}
                                            onClick={() => navigate(`/post/${post.id}`)}
                                            className="w-full text-left bg-[#343434] rounded-xl border border-white/10 p-3 hover:bg-[#3c3c3c] transition"
                                        >
                                            <p className="text-base font-semibold text-gray-100">{post.title}</p>
                                            <p className="text-xs text-gray-400 mt-1">by {post.authorUsername}</p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-lg font-semibold text-orange-400">Categories</h2>
                            {results.categories.length === 0 ? (
                                <p className="text-sm text-gray-400">No matching categories.</p>
                            ) : (
                                <div className="space-y-2">
                                    {results.categories.map((category) => (
                                        <button
                                            key={category.id}
                                            onClick={() => navigate(`/category/${category.id}`)}
                                            className="w-full text-left bg-[#343434] rounded-xl border border-white/10 p-3 hover:bg-[#3c3c3c] transition"
                                        >
                                            <p className="text-base font-semibold text-gray-100">{category.name}</p>
                                            <p className="text-xs text-gray-400 mt-1">{category.description}</p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-lg font-semibold text-orange-400">Users</h2>
                            {results.users.length === 0 ? (
                                <p className="text-sm text-gray-400">No matching users.</p>
                            ) : (
                                <div className="space-y-2">
                                    {results.users.map((profile) => (
                                        <button
                                            key={profile.id}
                                            onClick={() => navigate(`/profile/${profile.username}`)}
                                            className="w-full text-left bg-[#343434] rounded-xl border border-white/10 p-3 hover:bg-[#3c3c3c] transition"
                                        >
                                            <p className="text-base font-semibold text-gray-100">{profile.username}</p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {profile.postCount} post{profile.postCount !== 1 ? 's' : ''} • Reputation {profile.reputation ?? 0}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </section>
                    </>
                )}
            </main>
        </div>
    );
}
