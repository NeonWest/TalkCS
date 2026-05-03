import { useState, useEffect, useCallback } from 'react';
import { getAdminStats, getAdminUsers, setUserRole, deleteAdminUser, getSiteConfig, updateSiteConfig } from '../api/admin';
import { getAllCategoriesAdmin, updateCategory, deleteCategory, restoreCategory } from '../api/categories';
import type { AdminStats, UserAdmin, SiteConfig } from '../api/admin';
import type { Category } from '../api/categories';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';

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
    }, [tab, stats]);

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
    }, [tab, config]);

    const handleSetRole = async (id: number, role: string) => {
        const updated = await setUserRole(id, role);
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
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />

            <main className="max-w-6xl mx-auto px-4 py-6">
                <h1 className="text-2xl font-bold text-foreground mb-6">Admin Panel</h1>

                {/* Tabs */}
                <div className="flex gap-1 mb-6 bg-background rounded-xl p-1 w-full sm:w-fit border border-border overflow-x-auto no-scrollbar whitespace-nowrap">
                    {tabs.map(t => (
                        <button key={t.key} onClick={() => setTab(t.key)}
                            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition ${tab === t.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Stats Tab */}
                {tab === 'stats' && (
                    <div className="space-y-6">
                        {!stats ? (
                            <p className="text-muted-foreground">Loading...</p>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                                    {[
                                        { label: 'Total Users', value: stats.totalUsers },
                                        { label: 'Total Posts', value: stats.totalPosts },
                                        { label: 'Total Comments', value: stats.totalComments },
                                        { label: 'Total Resources', value: stats.totalResources },
                                        { label: 'Posts This Week', value: stats.postsThisWeek },
                                        { label: 'New Users This Week', value: stats.newUsersThisWeek },
                                    ].map(s => (
                                        <div key={s.label} className="bg-card rounded-xl border border-border p-4">
                                            <p className="text-2xl sm:text-3xl font-bold text-primary">{s.value}</p>
                                            <p className="text-xs sm:text-sm text-muted-foreground mt-1">{s.label}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="bg-card rounded-xl border border-border p-4 sm:p-5">
                                    <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider">Most Active Categories</h3>
                                    {stats.mostActiveCategories.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">No data yet.</p>
                                    ) : (
                                        <div className="space-y-4">
                                            {stats.mostActiveCategories.map((c, i) => {
                                                const max = stats.mostActiveCategories[0].postCount;
                                                const pct = max > 0 ? Math.round((c.postCount / max) * 100) : 0;
                                                return (
                                                    <div key={c.categoryId}>
                                                        <div className="flex justify-between text-sm mb-1.5">
                                                            <span className="text-muted-foreground font-medium">#{i + 1} {c.categoryName}</span>
                                                            <span className="text-primary font-semibold">{c.postCount} posts</span>
                                                        </div>
                                                        <div className="h-2 bg-popover rounded-full overflow-hidden">
                                                            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
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
                        <div className="flex flex-col sm:flex-row gap-3 mb-6">
                            <input
                                value={userSearch}
                                onChange={e => { setUserSearch(e.target.value); setUserPage(0); }}
                                onKeyDown={e => e.key === 'Enter' && loadUsers()}
                                placeholder="Search username..."
                                className="bg-card border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary flex-1 sm:max-w-xs"
                            />
                            <button onClick={loadUsers} className="w-full sm:w-auto px-6 py-2.5 bg-primary hover:bg-primary/90 rounded-lg text-sm font-semibold transition shadow-lg shadow-primary/10">Search</button>
                        </div>
                        
                        {/* Mobile User Cards */}
                        <div className="md:hidden space-y-4">
                            {users.map(u => (
                                <div key={u.id} className="bg-card rounded-xl border border-border p-4 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-bold text-foreground truncate">{u.username}</p>
                                            <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                                        </div>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${u.role === 'ADMIN' ? 'bg-primary/20 text-primary' : u.role === 'PROFESSOR' ? 'bg-blue-500/20 text-blue-500' : 'bg-muted text-muted-foreground'}`}>
                                            {u.role}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 py-2 border-y border-border">
                                        <div className="text-center">
                                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Rep</p>
                                            <p className="text-sm font-semibold text-muted-foreground">{u.reputation}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Posts</p>
                                            <p className="text-sm font-semibold text-muted-foreground">{u.postCount}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Cmts</p>
                                            <p className="text-sm font-semibold text-muted-foreground">{u.commentCount}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 pt-1">
                                        <select
                                            value={u.role}
                                            onChange={e => handleSetRole(u.id, e.target.value)}
                                            className="flex-1 text-xs px-2 py-2 bg-accent rounded-lg transition text-muted-foreground font-medium border border-border">
                                            <option value="STUDENT">Student</option>
                                            <option value="PROFESSOR">Professor</option>
                                            <option value="ADMIN">Admin</option>
                                        </select>
                                        <button onClick={() => handleDeleteUser(u.id, u.username)}
                                            className="text-xs px-3 py-2 bg-destructive/10 hover:bg-destructive rounded-lg transition text-destructive hover:text-primary-foreground font-medium">
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop Table */}
                        <div className="hidden md:block bg-card rounded-xl border border-border overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-popover border-b border-border">
                                    <tr>
                                        {['Username', 'Email', 'Role', 'Rep', 'Posts', 'Comments', 'Actions'].map(h => (
                                            <th key={h} className="text-left px-4 py-3 text-muted-foreground font-medium">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {users.map(u => (
                                        <tr key={u.id} className="hover:bg-accent/30">
                                            <td className="px-4 py-3 text-foreground">{u.username}</td>
                                            <td className="px-4 py-3 text-muted-foreground truncate max-w-[180px]">{u.email}</td>
                                            <td className="px-4 py-3">
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${u.role === 'ADMIN' ? 'bg-primary/10 text-primary' : u.role === 'PROFESSOR' ? 'bg-blue-500/10 text-blue-500' : 'bg-muted text-muted-foreground'}`}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">{u.reputation}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{u.postCount}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{u.commentCount}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1">
                                                    <select
                                                        value={u.role}
                                                        onChange={e => handleSetRole(u.id, e.target.value)}
                                                        className="text-xs px-2 py-1 bg-accent rounded transition text-muted-foreground border border-border">
                                                        <option value="STUDENT">Student</option>
                                                        <option value="PROFESSOR">Professor</option>
                                                        <option value="ADMIN">Admin</option>
                                                    </select>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => handleDeleteUser(u.id, u.username)}
                                                        title={`Delete ${u.username}`}
                                                        className="hover:bg-black/10 dark:hover:bg-accent text-muted-foreground hover:text-destructive transition-colors"
                                                    >
                                                        <Trash2 size={15} strokeWidth={2} />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {userTotalPages > 1 && (
                            <div className="flex flex-wrap gap-2 mt-6 justify-center sm:justify-start">
                                {Array.from({ length: userTotalPages }, (_, i) => (
                                    <button key={i} onClick={() => setUserPage(i)}
                                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition ${userPage === i ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-card text-muted-foreground hover:text-foreground'}`}>
                                        {i + 1}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Categories Tab */}
                {tab === 'categories' && (
                    <div className="space-y-4">
                        {editCat && (
                            <div className="fixed inset-0 bg-black/70 z-[110] flex items-center justify-center p-4 backdrop-blur-sm">
                                <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
                                    <h2 className="text-lg font-bold text-foreground mb-4">Edit Category</h2>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 ml-1">Name</label>
                                            <input value={editName} onChange={e => setEditName(e.target.value)}
                                                className="w-full bg-popover border border-border rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:border-primary transition-colors" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 ml-1">Description</label>
                                            <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={4}
                                                className="w-full bg-popover border border-border rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:border-primary resize-none transition-colors" />
                                        </div>
                                    </div>
                                    <div className="flex gap-3 mt-6">
                                        <button onClick={saveEditCat} className="flex-1 py-2.5 bg-primary hover:bg-primary/90 rounded-lg text-sm font-bold transition text-primary-foreground">Save Changes</button>
                                        <button onClick={() => setEditCat(null)} className="flex-1 py-2.5 bg-accent hover:bg-accent/80 rounded-lg text-sm font-bold transition text-muted-foreground">Cancel</button>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="grid gap-3">
                            {categories.map(cat => (
                                <div key={cat.id} className={`bg-card rounded-xl border border-border px-4 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:bg-accent/20 ${cat.archived ? 'opacity-50 grayscale-[0.5]' : ''}`}>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="text-foreground font-bold tracking-tight">{cat.name}</p>
                                            {cat.archived && <span className="text-[10px] bg-destructive/30 text-destructive px-2 py-0.5 rounded-full font-bold uppercase">Archived</span>}
                                        </div>
                                        <p className="text-sm text-muted-foreground line-clamp-2 sm:line-clamp-none">{cat.description}</p>
                                    </div>
                                    <div className="flex items-center gap-1 sm:shrink-0 border-t sm:border-t-0 border-border pt-3 sm:pt-0">
                                        {!cat.archived && (
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => openEditCat(cat)}
                                                title="Edit category"
                                                className="hover:bg-black/10 dark:hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                                            >
                                                <Pencil size={15} strokeWidth={2} />
                                            </Button>
                                        )}
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => cat.archived ? handleRestoreCat(cat.id) : handleArchiveCat(cat.id)}
                                            title={cat.archived ? 'Restore category' : 'Archive category'}
                                            className={`hover:bg-black/10 dark:hover:bg-accent transition-colors ${cat.archived ? 'text-green-500 hover:text-green-400' : 'text-muted-foreground hover:text-destructive'}`}
                                        >
                                            <Trash2 size={15} strokeWidth={2} />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Branding Tab */}
                {tab === 'branding' && (
                    <div className="max-w-lg">
                        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
                            <div>
                                <label className="block text-sm text-muted-foreground mb-1">Site Name</label>
                                <input value={brandName} onChange={e => setBrandName(e.target.value)}
                                    className="w-full bg-popover border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary" />
                            </div>
                            <div>
                                <label className="block text-sm text-muted-foreground mb-1">Tagline</label>
                                <input value={brandTagline} onChange={e => setBrandTagline(e.target.value)}
                                    className="w-full bg-popover border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary" />
                            </div>
                            <div>
                                <label className="block text-sm text-muted-foreground mb-1">Primary Color</label>
                                <div className="flex gap-3 items-center">
                                    <input type="color" value={brandColor} onChange={e => setBrandColor(e.target.value)}
                                        className="h-10 w-14 rounded-lg border border-border cursor-pointer bg-transparent" />
                                    <input value={brandColor} onChange={e => setBrandColor(e.target.value)}
                                        className="flex-1 bg-popover border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary font-mono text-sm" />
                                </div>
                            </div>
                            <button onClick={handleSaveBranding} disabled={brandSaving}
                                className="w-full py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 rounded-lg text-sm font-semibold transition">
                                {brandSaving ? 'Saving...' : 'Save Branding'}
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
