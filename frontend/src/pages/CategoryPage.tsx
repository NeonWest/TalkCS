import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCategoryById } from '../api/categories';
import { getPosts, createPost, updatePost, deletePost } from '../api/posts';
import type { Post } from '../api/posts';

export default function CategoryPage() {
    const { id } = useParams<{ id: string }>();
    const categoryId = Number(id);
    const navigate = useNavigate();
    const { user, logout, isAuthenticated } = useAuth();

    const [categoryName, setCategoryName] = useState('');
    const [categoryDescription, setCategoryDescription] = useState('');
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ title: '', body: '' });
    const [creating, setCreating] = useState(false);
    const [editingPost, setEditingPost] = useState<Post | null>(null);
    const [editForm, setEditForm] = useState({ title: '', body: '' });
    const [savingEdit, setSavingEdit] = useState(false);
    const [deletingPostId, setDeletingPostId] = useState<number | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        Promise.all([
            getCategoryById(categoryId).then(c => {
                setCategoryName(c.name);
                setCategoryDescription(c.description);
            }),
            getPosts(categoryId).then(setPosts),
        ]).finally(() => setLoading(false));
    }, [categoryId]);

    const handleLogout = () => { logout(); navigate('/login'); };

    const handleMyProfile = () => {
        if (!user?.username) return;
        navigate(`/profile/${user.username}`);
    };

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

    const openEditModal = (post: Post) => {
        setError('');
        setEditingPost(post);
        setEditForm({ title: post.title, body: post.body });
    };

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingPost) return;

        setError('');
        setSavingEdit(true);
        try {
            const updated = await updatePost(editingPost.id, {
                title: editForm.title,
                body: editForm.body,
                categoryId,
            });
            setPosts(prev => prev.map(p => (p.id === updated.id ? updated : p)));
            setEditingPost(null);
        } catch {
            setError('Failed to update post.');
        } finally {
            setSavingEdit(false);
        }
    };

    const handleDelete = async (post: Post) => {
        const confirmed = window.confirm('Delete this post? This action cannot be undone.');
        if (!confirmed) return;

        setError('');
        setDeletingPostId(post.id);
        try {
            await deletePost(post.id);
            setPosts(prev => prev.filter(p => p.id !== post.id));
        } catch {
            setError('Failed to delete post.');
        } finally {
            setDeletingPostId(null);
        }
    };

    return (
        <div className="min-h-screen bg-[#1f1f1f] text-gray-100">
            {/* Navbar */}
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

            <main className="max-w-4xl mx-auto px-4 py-6">
                {/* Category Banner */}
                <div className="rounded-none md:rounded-xl shadow-sm border border-white/10 bg-[#343434] mb-6 overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500" />
                    <div className="p-5">
                        <h2 className="text-2xl font-bold text-gray-100">{categoryName || 'Loading...'}</h2>
                        <p className="text-sm text-gray-300 mt-1">{categoryDescription || 'General discussion space'}</p>
                        {isAuthenticated && (
                            <button
                                onClick={() => setShowModal(true)}
                                className="mt-4 text-sm bg-orange-500 text-white hover:bg-orange-600 px-4 py-1.5 rounded-xl transition font-semibold shadow-sm"
                            >
                                + New Post
                            </button>
                        )}
                    </div>
                </div>

                {error && <p className="text-base text-red-400 mb-4">{error}</p>}

                {loading ? (
                    <p className="text-base text-gray-400">Loading...</p>
                ) : posts.length === 0 ? (
                    <div className="bg-[#101010] rounded-xl shadow-sm p-12 text-center text-gray-400 border border-white/10">
                        No posts yet. Be the first to post!
                    </div>
                ) : (
                    <div className="space-y-2.5">
                        {posts.map(post => (
                            <div
                                key={post.id}
                                onClick={() => navigate(`/post/${post.id}?categoryId=${categoryId}`, { state: { categoryId } })}
                                className="bg-[#343434] rounded-xl shadow-sm border border-white/10 px-4 py-3 hover:shadow-md hover:-translate-y-0.5 transition cursor-pointer"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-lg font-semibold text-orange-500 truncate">{post.title}</p>
                                        <div className="text-sm text-gray-300 mt-2 flex items-center gap-2.5 flex-wrap">
                                            <span className="h-8 w-8 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center font-semibold">
                                                {post.authorUsername.charAt(0).toUpperCase()}
                                            </span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/profile/${post.authorUsername}`);
                                                }}
                                                className="text-gray-200 hover:text-white transition font-medium"
                                            >
                                                {post.authorUsername}
                                            </button>
                                            <span>•</span>
                                            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                                            <span>•</span>
                                            <span className="font-semibold">{post.commentCount} comments</span>
                                        </div>
                                    </div>
                                </div>
                                {(user?.username === post.authorUsername || user?.role === 'ADMIN') && (
                                    <div className="mt-2 pt-2 border-t border-white/10 flex items-center gap-3">
                                        {user?.username === post.authorUsername && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openEditModal(post);
                                                }}
                                                className="text-xs text-blue-400 hover:text-blue-300 transition"
                                            >
                                                Edit
                                            </button>
                                        )}
                                        {user?.username === post.authorUsername || user?.role === 'ADMIN' ? (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    void handleDelete(post);
                                                }}
                                                disabled={deletingPostId === post.id}
                                                className="text-xs text-red-400 hover:text-red-300 transition disabled:opacity-50"
                                            >
                                                {deletingPostId === post.id ? 'Deleting...' : 'Delete'}
                                            </button>
                                        ) : null}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Create post modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#2d2d2d] text-gray-100 rounded-xl shadow-xl w-full max-w-2xl p-6 border border-white/10">
                        <h3 className="text-lg font-semibold text-gray-100 mb-4">New Post</h3>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                                <input
                                    id="post-title"
                                    type="text"
                                    value={form.title}
                                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                                    required
                                    className="w-full bg-[#242424] border border-white/15 rounded-lg px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-orange-400"
                                    placeholder="What's your question or topic?"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Body</label>
                                <textarea
                                    id="post-body"
                                    value={form.body}
                                    onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
                                    required
                                    rows={5}
                                    className="w-full bg-[#242424] border border-white/15 rounded-lg px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                                    placeholder="Share details, context, or your thoughts..."
                                />
                            </div>
                            {error && <p className="text-sm text-red-500">{error}</p>}
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => { setShowModal(false); setError(''); }}
                                    className="text-sm px-4 py-2 rounded-lg border border-white/20 text-gray-300 hover:bg-white/10 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="text-sm px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium transition disabled:opacity-50"
                                >
                                    {creating ? 'Posting...' : 'Post'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit post modal */}
            {editingPost && (
                <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#2d2d2d] text-gray-100 rounded-xl shadow-xl w-full max-w-2xl p-6 border border-white/10">
                        <h3 className="text-lg font-semibold text-gray-100 mb-4">Edit Post</h3>
                        <form onSubmit={handleEdit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                                <input
                                    id="edit-post-title"
                                    type="text"
                                    value={editForm.title}
                                    onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))}
                                    required
                                    className="w-full bg-[#242424] border border-white/15 rounded-lg px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-orange-400"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Body</label>
                                <textarea
                                    id="edit-post-body"
                                    value={editForm.body}
                                    onChange={e => setEditForm(p => ({ ...p, body: e.target.value }))}
                                    required
                                    rows={5}
                                    className="w-full bg-[#242424] border border-white/15 rounded-lg px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                                />
                            </div>
                            {error && <p className="text-sm text-red-500">{error}</p>}
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => { setEditingPost(null); setError(''); }}
                                    className="text-sm px-4 py-2 rounded-lg border border-white/20 text-gray-300 hover:bg-white/10 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingEdit}
                                    className="text-sm px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium transition disabled:opacity-50"
                                >
                                    {savingEdit ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
