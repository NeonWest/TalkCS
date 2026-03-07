import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCategoryById } from '../api/categories';
import { getPosts, createPost } from '../api/posts';
import type { Post } from '../api/posts';

export default function CategoryPage() {
    const { id } = useParams<{ id: string }>();
    const categoryId = Number(id);
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const [categoryName, setCategoryName] = useState('');
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ title: '', body: '' });
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        Promise.all([
            getCategoryById(categoryId).then(c => setCategoryName(c.name)),
            getPosts(categoryId).then(setPosts),
        ]).finally(() => setLoading(false));
    }, [categoryId]);

    const handleLogout = () => { logout(); navigate('/login'); };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setCreating(true);
        try {
            const created = await createPost({ ...form, categoryId });
            setPosts(prev => [created, ...prev]);
            setForm({ title: '', body: '' });
            setShowModal(false);
        } catch {
            setError('Failed to create post.');
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navbar */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-5xl mx-auto px-4 h-12 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/')}
                            className="text-sm text-gray-500 hover:text-gray-800 transition"
                        >
                            ← Back
                        </button>
                        <span className="font-bold text-gray-800 text-lg">TalkCS</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600">{user?.email}</span>
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-medium">{user?.role}</span>
                        <button
                            onClick={handleLogout}
                            className="text-sm text-gray-500 hover:text-gray-800 transition"
                        >
                            Log out
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800">{categoryName || 'Loading...'}</h2>
                        <p className="text-sm text-gray-500 mt-0.5">{posts.length} post{posts.length !== 1 ? 's' : ''}</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="text-sm bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded transition font-medium"
                    >
                        + New Post
                    </button>
                </div>

                {loading ? (
                    <p className="text-sm text-gray-400">Loading...</p>
                ) : posts.length === 0 ? (
                    <div className="bg-white border border-gray-200 rounded p-8 text-center text-gray-400 text-sm">
                        No posts yet. Be the first to post!
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
                                    <p className="text-xs text-gray-500 mt-0.5">by {post.authorUsername}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-xs text-gray-500">{post.commentCount} comment{post.commentCount !== 1 ? 's' : ''}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{new Date(post.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Create post modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 mx-4">
                        <h3 className="text-base font-semibold text-gray-800 mb-4">New Post</h3>
                        <form onSubmit={handleCreate} className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                                    required
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                                    placeholder="Post title"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Body</label>
                                <textarea
                                    value={form.body}
                                    onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
                                    required
                                    rows={5}
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                                    placeholder="Write your post..."
                                />
                            </div>
                            {error && <p className="text-xs text-red-500">{error}</p>}
                            <div className="flex justify-end gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={() => { setShowModal(false); setError(''); setForm({ title: '', body: '' }); }}
                                    className="text-sm px-4 py-2 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="text-sm px-4 py-2 rounded bg-orange-500 hover:bg-orange-600 text-white font-medium transition disabled:opacity-50"
                                >
                                    {creating ? 'Posting...' : 'Post'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
