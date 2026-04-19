import { useState, useEffect, useCallback } from 'react';
import { getAdminStats, getAdminUsers, toggleUserRole, deleteAdminUser, getSiteConfig, updateSiteConfig } from '../api/admin';
import { getAllCategoriesAdmin, updateCategory, deleteCategory, restoreCategory } from '../api/categories';
import type { AdminStats, UserAdmin, SiteConfig } from '../api/admin';
import type { Category } from '../api/categories';
import Navbar from '../components/Navbar';

type Tab = 'stats' | 'users' | 'categories' | 'branding';

export default function AdminPage() {
    const [tab, setTab] = useState<Tab>('stats');

    // Stats
    const [stats, setStats] = useState<AdminStats | null>(null);

    // Users
    const [users, setUsers] = useState<UserAdmin[]>([]);
    const [userSearch, setUserSearch] = useState('');
    const [userPage, setUserPage] = useState(0);
    const [userTotalPages, setUserTotalPages] = useState(0);

    // Categories
    const [categories, setCategories] = useState<Category[]>([]);
    const [editCat, setEditCat] = useState<Category | null>(null);
    const [editName, setEditName] = useState('');
    const [editDesc, setEditDesc] = useState('');

    // Branding
    const [config, setConfig] = useState<SiteConfig | null>(null);
    const [brandName, setBrandName] = useState('');
    const [brandTagline, setBrandTagline] = useState('');
    const [brandColor, setBrandColor] = useState('');
    const [brandSaving, setBrandSaving] = useState(false);

    useEffect(() => {
        if (tab === 'stats' && !stats) {
            getAdminStats().then(setStats).catch(console.error);
        }
    }, [tab]);

    const loadUsers = useCallback(() => {
        getAdminUsers(userPage, userSearch || undefined).then(r => {
            setUsers(r.content);
            setUserTotalPages(r.totalPages);
        }).catch(console.error);
    }, [userPage, userSearch]);

    useEffect(() => {
        if (tab === 'users') loadUsers();
    }, [tab, loadUsers]);

    useEffect(() => {
        if (tab === 'categories') {
            getAllCategoriesAdmin().then(setCategories).catch(console.error);
        }
    }, [tab]);

    useEffect(() => {
        if (tab === 'branding' && !config) {
            getSiteConfig().then(c => {
                setConfig(c);
                setBrandName(c.siteName);
                setBrandTagline(c.siteTagline);
                setBrandColor(c.primaryColor);
            }).catch(console.error);
        }
    }, [tab]);

    const handleToggleRole = async (id: number) => {
        const updated = await toggleUserRole(id);
        setUsers(prev => prev.map(u => u.id === id ? updated : u));
    };

    const handleDeleteUser = async (id: number, username: string) => {
        if (!confirm(`Anonymize user "${username}"? This cannot be undone.`)) return;
        await deleteAdminUser(id);
        loadUsers();
    };

    const openEditCat = (cat: Category) => {
        setEditCat(cat);
        setEditName(cat.name);
        setEditDesc(cat.description);
    };

    const saveEditCat = async () => {
        if (!editCat) return;
        await updateCategory(editCat.id, { name: editName, description: editDesc });
        setCategories(prev => prev.map(c => c.id === editCat.id ? { ...c, name: editName, description: editDesc } : c));
        setEditCat(null);
    };

    const handleArchiveCat = async (id: number) => {
        await deleteCategory(id);
        setCategories(prev => prev.map(c => c.id === id ? { ...c, archived: true } : c));
    };

    const handleRestoreCat = async (id: number) => {
        await restoreCategory(id);
        setCategories(prev => prev.map(c => c.id === id ? { ...c, archived: false } : c));
    };

    const handleSaveBranding = async () => {
        setBrandSaving(true);
        try {
            const updated = await updateSiteConfig({ siteName: brandName, siteTagline: brandTagline, primaryColor: brandColor });
            setConfig(updated);
        } finally {
            setBrandSaving(false);
        }
    };

    const tabs: { key: Tab; label: string }[] = [
        { key: 'stats', label: 'Analytics' },
        { key: 'users', label: 'Users' },
        { key: 'categories', label: 'Categories' },
        { key: 'branding', label: 'Branding' },
    ];

    return (
        <div className="min-h-screen bg-[#1a1a1a] text-gray-100">
            <Navbar />

            <main className="max-w-6xl mx-auto px-4 py-6">
                <h1 className="text-2xl font-bold text-white mb-6">Admin Panel</h1>

                {/* Tabs */}
                <div className="flex gap-1 mb-6 bg-[#111] rounded-xl p-1 w-fit border border-white/10">
                    {tabs.map(t => (
                        <button key={t.key} onClick={() => setTab(t.key)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === t.key ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'}`}>
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Stats Tab */}
                {tab === 'stats' && (
                    <div>
                        {!stats ? (
                            <p className="text-gray-400">Loading...</p>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                                    {[
                                        { label: 'Total Users', value: stats.totalUsers },
                                        { label: 'Total Posts', value: stats.totalPosts },
                                        { label: 'Total Comments', value: stats.totalComments },
                                        { label: 'Total Resources', value: stats.totalResources },
                                        { label: 'Posts This Week', value: stats.postsThisWeek },
                                        { label: 'New Users This Week', value: stats.newUsersThisWeek },
                                    ].map(s => (
                                        <div key={s.label} className="bg-[#2d2d2d] rounded-xl border border-white/10 p-4">
                                            <p className="text-3xl font-bold text-orange-500">{s.value}</p>
                                            <p className="text-sm text-gray-400 mt-1">{s.label}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="bg-[#2d2d2d] rounded-xl border border-white/10 p-4">
                                    <h3 className="text-sm font-bold text-gray-200 mb-4">Most Active Categories</h3>
                                    {stats.mostActiveCategories.length === 0 ? (
                                        <p className="text-sm text-gray-400">No data yet.</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {stats.mostActiveCategories.map((c, i) => {
                                                const max = stats.mostActiveCategories[0].postCount;
                                                const pct = max > 0 ? Math.round((c.postCount / max) * 100) : 0;
                                                return (
                                                    <div key={c.categoryId}>
                                                        <div className="flex justify-between text-sm mb-1">
                                                            <span className="text-gray-300">#{i + 1} {c.categoryName}</span>
                                                            <span className="text-orange-400 font-semibold">{c.postCount} posts</span>
                                                        </div>
                                                        <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                                                            <div className="h-full bg-orange-500 rounded-full" style={{ width: `${pct}%` }} />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Users Tab */}
                {tab === 'users' && (
                    <div>
                        <div className="flex gap-3 mb-4">
                            <input
                                value={userSearch}
                                onChange={e => { setUserSearch(e.target.value); setUserPage(0); }}
                                onKeyDown={e => e.key === 'Enter' && loadUsers()}
                                placeholder="Search username..."
                                className="bg-[#2d2d2d] border border-white/15 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-orange-500 w-64"
                            />
                            <button onClick={loadUsers} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg text-sm font-semibold transition">Search</button>
                        </div>
                        <div className="bg-[#2d2d2d] rounded-xl border border-white/10 overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-[#1a1a1a] border-b border-white/10">
                                    <tr>
                                        {['Username', 'Email', 'Role', 'Rep', 'Posts', 'Comments', 'Actions'].map(h => (
                                            <th key={h} className="text-left px-4 py-3 text-gray-400 font-medium">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {users.map(u => (
                                        <tr key={u.id} className="hover:bg-white/5">
                                            <td className="px-4 py-3 text-gray-100">{u.username}</td>
                                            <td className="px-4 py-3 text-gray-400 truncate max-w-[180px]">{u.email}</td>
                                            <td className="px-4 py-3">
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${u.role === 'ADMIN' ? 'bg-orange-100 text-orange-700' : 'bg-gray-700 text-gray-300'}`}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-400">{u.reputation}</td>
                                            <td className="px-4 py-3 text-gray-400">{u.postCount}</td>
                                            <td className="px-4 py-3 text-gray-400">{u.commentCount}</td>
                                            <td className="px-4 py-3 flex gap-2">
                                                <button onClick={() => handleToggleRole(u.id)}
                                                    className="text-xs px-2 py-1 bg-[#3a3a3a] hover:bg-orange-500 rounded transition text-gray-300 hover:text-white">
                                                    {u.role === 'ADMIN' ? 'Revoke Admin' : 'Make Admin'}
                                                </button>
                                                <button onClick={() => handleDeleteUser(u.id, u.username)}
                                                    className="text-xs px-2 py-1 bg-red-900/40 hover:bg-red-700 rounded transition text-red-400 hover:text-white">
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {userTotalPages > 1 && (
                            <div className="flex gap-2 mt-4">
                                {Array.from({ length: userTotalPages }, (_, i) => (
                                    <button key={i} onClick={() => setUserPage(i)}
                                        className={`px-3 py-1 rounded text-sm ${userPage === i ? 'bg-orange-500 text-white' : 'bg-[#2d2d2d] text-gray-400 hover:text-white'}`}>
                                        {i + 1}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Categories Tab */}
                {tab === 'categories' && (
                    <div>
                        {editCat && (
                            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
                                <div className="bg-[#2d2d2d] rounded-2xl border border-white/15 p-6 w-full max-w-md shadow-2xl">
                                    <h2 className="text-lg font-bold text-white mb-4">Edit Category</h2>
                                    <div className="space-y-3">
                                        <input value={editName} onChange={e => setEditName(e.target.value)}
                                            className="w-full bg-[#1a1a1a] border border-white/15 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-orange-500" />
                                        <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={3}
                                            className="w-full bg-[#1a1a1a] border border-white/15 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-orange-500 resize-none" />
                                    </div>
                                    <div className="flex gap-3 mt-4">
                                        <button onClick={saveEditCat} className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg text-sm font-semibold transition">Save</button>
                                        <button onClick={() => setEditCat(null)} className="flex-1 py-2 bg-[#3a3a3a] hover:bg-[#444] rounded-lg text-sm font-semibold transition">Cancel</button>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="grid gap-3">
                            {categories.map(cat => (
                                <div key={cat.id} className={`bg-[#2d2d2d] rounded-xl border border-white/10 px-4 py-3 flex items-center justify-between ${cat.archived ? 'opacity-50' : ''}`}>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-gray-100 font-medium">{cat.name}</p>
                                            {cat.archived && <span className="text-xs bg-red-900/50 text-red-400 px-2 py-0.5 rounded-full">Archived</span>}
                                        </div>
                                        <p className="text-sm text-gray-400 mt-0.5">{cat.description}</p>
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                        {!cat.archived && (
                                            <button onClick={() => openEditCat(cat)}
                                                className="text-xs px-3 py-1.5 bg-[#3a3a3a] hover:bg-orange-500 rounded-lg transition text-gray-300 hover:text-white">
                                                Edit
                                            </button>
                                        )}
                                        {cat.archived ? (
                                            <button onClick={() => handleRestoreCat(cat.id)}
                                                className="text-xs px-3 py-1.5 bg-green-900/40 hover:bg-green-700 rounded-lg transition text-green-400 hover:text-white">
                                                Restore
                                            </button>
                                        ) : (
                                            <button onClick={() => handleArchiveCat(cat.id)}
                                                className="text-xs px-3 py-1.5 bg-red-900/40 hover:bg-red-700 rounded-lg transition text-red-400 hover:text-white">
                                                Archive
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Branding Tab */}
                {tab === 'branding' && (
                    <div className="max-w-lg">
                        <div className="bg-[#2d2d2d] rounded-xl border border-white/10 p-6 space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Site Name</label>
                                <input value={brandName} onChange={e => setBrandName(e.target.value)}
                                    className="w-full bg-[#1a1a1a] border border-white/15 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-orange-500" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Tagline</label>
                                <input value={brandTagline} onChange={e => setBrandTagline(e.target.value)}
                                    className="w-full bg-[#1a1a1a] border border-white/15 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-orange-500" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Primary Color</label>
                                <div className="flex gap-3 items-center">
                                    <input type="color" value={brandColor} onChange={e => setBrandColor(e.target.value)}
                                        className="h-10 w-14 rounded-lg border border-white/15 cursor-pointer bg-transparent" />
                                    <input value={brandColor} onChange={e => setBrandColor(e.target.value)}
                                        className="flex-1 bg-[#1a1a1a] border border-white/15 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-orange-500 font-mono text-sm" />
                                </div>
                            </div>
                            <button onClick={handleSaveBranding} disabled={brandSaving}
                                className="w-full py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 rounded-lg text-sm font-semibold transition">
                                {brandSaving ? 'Saving...' : 'Save Branding'}
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
