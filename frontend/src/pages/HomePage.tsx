import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getCategories, createCategory } from '../api/categories';
import type { Category } from '../api/categories';

export default function HomePage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ name: '', description: '' });
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState('');

    const isAdmin = user?.role === 'ADMIN';

    useEffect(() => {
        getCategories()
            .then(setCategories)
            .finally(() => setLoading(false));
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setCreating(true);
        try {
            const created = await createCategory(form);
            setCategories(prev => [...prev, created]);
            setForm({ name: '', description: '' });
            setShowModal(false);
        } catch {
            setError('Failed to create category. It may already exist.');
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navbar */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-5xl mx-auto px-4 h-12 flex items-center justify-between">
                    <span className="font-bold text-gray-800 text-lg">TalkCS</span>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600">{user?.email}</span>
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-medium">{user?.role}</span>
                        <button
                            id="logout-btn"
                            onClick={handleLogout}
                            className="text-sm text-gray-500 hover:text-gray-800 transition"
                        >
                            Log out
                        </button>
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="max-w-5xl mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800">Forum Categories</h2>
                        <p className="text-sm text-gray-500 mt-0.5">Browse topics and start a discussion</p>
                    </div>
                    {isAdmin && (
                        <button
                            id="new-category-btn"
                            onClick={() => setShowModal(true)}
                            className="text-sm bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded transition font-medium"
                        >
                            + New Category
                        </button>
                    )}
                </div>

                {/* Category list */}
                {loading ? (
                    <p className="text-sm text-gray-400">Loading...</p>
                ) : categories.length === 0 ? (
                    <div className="bg-white border border-gray-200 rounded p-8 text-center text-gray-400 text-sm">
                        No categories yet.{isAdmin && ' Create the first one!'}
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200 border border-gray-200 rounded bg-white">
                        {categories.map(cat => (
                            <div
                                key={cat.id}
                                className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50 transition cursor-pointer"
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-blue-600 hover:text-blue-800 truncate">{cat.name}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{cat.description}</p>
                                </div>
                                <span className="text-xs text-gray-400 whitespace-nowrap mt-0.5">
                                    {new Date(cat.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Create category modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 mx-4">
                        <h3 className="text-base font-semibold text-gray-800 mb-4">New Category</h3>
                        <form onSubmit={handleCreate} className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
                                <input
                                    id="category-name"
                                    type="text"
                                    value={form.name}
                                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                    required
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                                    placeholder="e.g. General"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                                <input
                                    id="category-description"
                                    type="text"
                                    value={form.description}
                                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                    required
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                                    placeholder="What is this category about?"
                                />
                            </div>
                            {error && <p className="text-xs text-red-500">{error}</p>}
                            <div className="flex justify-end gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={() => { setShowModal(false); setError(''); }}
                                    className="text-sm px-4 py-2 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition"
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
