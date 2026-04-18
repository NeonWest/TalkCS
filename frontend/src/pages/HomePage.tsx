import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getCategories, createCategory } from '../api/categories';
import { getPosts, getTrendingPosts } from '../api/posts';
import type { Post } from '../api/posts';
import type { Category } from '../api/categories';
import NavbarSearch from '../components/NavbarSearch';

export default function HomePage() {
    const { user, logout, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const [categories, setCategories] = useState<Category[]>([]);
    const [postCounts, setPostCounts] = useState<Record<number, number>>({});
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ name: '', description: '' });
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState('');
    const [trending, setTrending] = useState<Post[]>([]);

    const isAdmin = user?.role === 'ADMIN';

    useEffect(() => {
        const loadCategoriesAndCounts = async () => {
            try {
                const fetchedCategories = await getCategories();
                setCategories(fetchedCategories);

                const countResults = await Promise.all(
                    fetchedCategories.map(async (cat) => {
                        try {
                            const paged = await getPosts(cat.id, 0, 1);
                            return [cat.id, paged.totalItems] as const;
                        } catch {
                            return [cat.id, 0] as const;
                        }
                    })
                );

                setPostCounts(Object.fromEntries(countResults));
            } finally {
                setLoading(false);
            }
        };

        void loadCategoriesAndCounts();
        getTrendingPosts(8).then(setTrending).catch(() => {});
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleMyProfile = () => {
        if (!user?.username) return;
        navigate(`/profile/${user.username}`);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setCreating(true);
        try {
            const created = await createCategory(form);
            setCategories(prev => [...prev, created]);
            setPostCounts(prev => ({ ...prev, [created.id]: 0 }));
            setForm({ name: '', description: '' });
            setShowModal(false);
        } catch {
            setError('Failed to create category. It may already exist.');
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#1f1f1f] text-gray-100">
            {/* Navbar */}
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
                                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold">{user?.role}</span>
                                <button
                                    onClick={() => navigate('/leaderboard')}
                                    className="text-sm text-gray-300 hover:text-white transition"
                                >
                                    Leaderboard
                                </button>
                                <button
                                    onClick={handleMyProfile}
                                    disabled={!user?.username}
                                    className="text-sm text-orange-500 hover:text-orange-400 transition disabled:opacity-50"
                                >
                                    My Profile
                                </button>
                                <button
                                    id="logout-btn"
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

            {/* Main content */}
            <main className="max-w-5xl mx-auto px-4 py-6 flex gap-6 items-start">
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-6 mt-1">
                    <div>
                        <h2 className="text-xl font-bold text-white">Forum Categories</h2>
                        <p className="text-sm text-gray-300 mt-1">Browse topics and start a discussion</p>
                    </div>
                    {isAdmin && (
                        <button
                            id="new-category-btn"
                            onClick={() => setShowModal(true)}
                            className="text-sm bg-transparent border border-gray-500 hover:border-gray-300 text-gray-100 px-4 py-1.5 rounded-xl transition font-semibold"
                        >
                            + New Category
                        </button>
                    )}
                </div>

                {/* Category cards */}
                {loading ? (
                    <p className="text-base text-gray-400">Loading...</p>
                ) : categories.length === 0 ? (
                    <div className="bg-[#101010] rounded-xl shadow-sm p-12 text-center text-gray-400 border border-white/10">
                        No categories yet.{isAdmin && ' Create the first one!'}
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {categories.map((cat, idx) => (
                            <div
                                key={cat.id}
                                onClick={() => navigate(`/category/${cat.id}`)}
                                className={`bg-[#3a3a3a] rounded-xl shadow-sm border border-white/15 px-4 py-3 hover:shadow-md hover:-translate-y-0.5 transition cursor-pointer flex items-center justify-between gap-4 ${idx % 3 === 0 ? 'border-l-4 border-l-orange-500' : idx % 3 === 1 ? 'border-l-4 border-l-orange-400' : 'border-l-4 border-l-orange-600'}`}
                            >
                                <div className="flex items-start gap-4 min-w-0">
                                    <div className="h-9 w-9 rounded-lg bg-gray-200 text-gray-700 text-sm flex items-center justify-center font-bold shrink-0">
                                        {cat.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-base font-semibold text-gray-100 truncate">{cat.name}</p>
                                        <p className="text-sm text-gray-300 mt-0.5">{cat.description}</p>
                                    </div>
                                </div>
                                <div className="w-14 text-center shrink-0">
                                    <p className="text-lg text-orange-500 font-semibold leading-none">{postCounts[cat.id] ?? 0}</p>
                                    <p className="text-xs text-gray-300 mt-0.5">posts</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Trending sidebar */}
            <aside className="w-64 shrink-0 hidden lg:block">
                <div className="bg-[#2d2d2d] rounded-xl border border-white/10 p-4">
                    <h3 className="text-sm font-bold text-gray-200 mb-3">🔥 Trending This Week</h3>
                    {trending.length === 0 ? (
                        <p className="text-xs text-gray-400">No trending posts yet.</p>
                    ) : (
                        <div className="space-y-2">
                            {trending.map((post, i) => (
                                <button key={post.id} onClick={() => navigate(`/post/${post.id}`)}
                                    className="w-full text-left group">
                                    <div className="flex gap-2 items-start">
                                        <span className="text-xs text-orange-500 font-bold w-4 shrink-0 mt-0.5">#{i + 1}</span>
                                        <p className="text-xs text-gray-300 group-hover:text-white transition line-clamp-2 leading-snug">{post.title}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </aside>
            </main>

            {/* Create category modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
                    <div className="bg-[#2d2d2d] text-gray-100 rounded-xl shadow-xl w-full max-w-md p-6 mx-4 border border-white/10">
                        <h3 className="text-lg font-semibold text-gray-100 mb-4">New Category</h3>
                        <form onSubmit={handleCreate} className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-300 mb-1">Name</label>
                                <input
                                    id="category-name"
                                    type="text"
                                    value={form.name}
                                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                    required
                                    className="w-full bg-[#242424] border border-white/15 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                                    placeholder="e.g. General"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-300 mb-1">Description</label>
                                <input
                                    id="category-description"
                                    type="text"
                                    value={form.description}
                                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                    required
                                    className="w-full bg-[#242424] border border-white/15 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                                    placeholder="What is this category about?"
                                />
                            </div>
                            {error && <p className="text-xs text-red-500">{error}</p>}
                            <div className="flex justify-end gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={() => { setShowModal(false); setError(''); }}
                                    className="text-sm px-4 py-2 rounded border border-white/20 text-gray-300 hover:bg-white/10 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="text-sm px-4 py-2 rounded bg-orange-500 hover:bg-orange-600 text-white font-medium transition disabled:opacity-50"
                                >
                                    {creating ? 'Creating...' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
