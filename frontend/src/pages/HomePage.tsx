import { useState } from 'react';
import { useAuth } from '../context/useAuth';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../api/categories';
import { getPosts, getTrendingPosts } from '../api/posts';
import type { Category } from '../api/categories';
import Navbar from '../components/Navbar';

export default function HomePage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ name: '', description: '' });
    const [editCat, setEditCat] = useState<Category | null>(null);
    const [editName, setEditName] = useState('');
    const [editDesc, setEditDesc] = useState('');

    const isAdmin = user?.role === 'ADMIN' || user?.role === 'PROFESSOR';

    // Queries
    const { data: categories = [], isLoading: loadingCategories } = useQuery({
        queryKey: ['categories'],
        queryFn: getCategories,
    });

    const { data: trending = [] } = useQuery({
        queryKey: ['trendingPosts'],
        queryFn: () => getTrendingPosts(8),
    });

    // Helper query for post counts (parallel fetches managed by Query)
    const { data: postCounts = {} } = useQuery({
        queryKey: ['postCounts', categories.map(c => c.id)],
        queryFn: async () => {
            const counts: Record<number, number> = {};
            await Promise.all(
                categories.map(async (cat) => {
                    try {
                        const paged = await getPosts(cat.id, 0, 1);
                        counts[cat.id] = paged.totalItems;
                    } catch {
                        counts[cat.id] = 0;
                    }
                })
            );
            return counts;
        },
        enabled: categories.length > 0,
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: createCategory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            toast.success('Category created successfully');
            setShowModal(false);
            setForm({ name: '', description: '' });
        },
        onError: () => toast.error('Failed to create category. It may already exist.')
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number, data: { name: string, description: string } }) => updateCategory(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            toast.success('Category updated');
            setEditCat(null);
        },
        onError: () => toast.error('Failed to update category')
    });

    const deleteMutation = useMutation({
        mutationFn: deleteCategory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            toast.success('Category archived');
        },
        onError: () => toast.error('Failed to archive category')
    });

    const openEditCat = (e: React.MouseEvent, cat: Category) => {
        e.stopPropagation();
        setEditCat(cat);
        setEditName(cat.name);
        setEditDesc(cat.description);
    };

    const handleSaveEdit = () => {
        if (editCat) {
            updateMutation.mutate({ id: editCat.id, data: { name: editName, description: editDesc } });
        }
    };

    const handleArchiveCat = (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        toast.info('Are you sure?', {
            action: {
                label: 'Archive',
                onClick: () => deleteMutation.mutate(id)
            }
        });
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        createMutation.mutate(form);
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />

            <main className="max-w-5xl mx-auto px-4 py-6 flex gap-6 items-start">
                <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 mt-1">
                        <div>
                            <h2 className="text-xl font-bold text-foreground">Forum Categories</h2>
                            <p className="text-sm text-muted-foreground mt-1">Browse topics and start a discussion</p>
                        </div>
                        {isAdmin && (
                            <button
                                onClick={() => setShowModal(true)}
                                className="w-full sm:w-auto text-sm bg-transparent border border-border hover:border-foreground/50 text-foreground px-4 py-1.5 rounded-xl transition font-semibold"
                            >
                                + New Category
                            </button>
                        )}
                    </div>

                    {loadingCategories ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-20 bg-card/50 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : categories.length === 0 ? (
                        <div className="bg-muted/50 rounded-xl shadow-sm p-12 text-center text-muted-foreground border border-border">
                            No categories yet.{isAdmin && ' Create the first one!'}
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {categories.map((cat, idx) => (
                                <div
                                    key={cat.id}
                                    onClick={() => navigate(`/category/${cat.id}`)}
                                    className={`bg-card rounded-xl shadow-sm border border-border/50 px-4 py-3 hover:shadow-md hover:-translate-y-0.5 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${idx % 3 === 0 ? 'border-l-4 border-l-primary' : idx % 3 === 1 ? 'border-l-4 border-l-primary/80' : 'border-l-4 border-l-primary/60'}`}
                                >
                                    <div className="flex items-start gap-4 min-w-0">
                                        <div className="h-9 w-9 rounded-lg bg-secondary text-foreground text-sm flex items-center justify-center font-bold shrink-0">
                                            {cat.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-base font-semibold text-foreground truncate">{cat.name}</p>
                                            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2 sm:line-clamp-none">{cat.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                                        <div className="w-14 text-center">
                                            <p className="text-lg text-primary font-semibold leading-none">{postCounts[cat.id] ?? 0}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">posts</p>
                                        </div>
                                        {isAdmin && (
                                            <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                                                <button onClick={e => openEditCat(e, cat)}
                                                    className="text-xs px-2 py-1 bg-secondary hover:bg-primary rounded transition text-muted-foreground hover:text-white">
                                                    Edit
                                                </button>
                                                <button onClick={e => handleArchiveCat(e, cat.id)}
                                                    className="text-xs px-2 py-1 bg-destructive/20 hover:bg-destructive rounded transition text-destructive hover:text-white">
                                                    Archive
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <aside className="w-64 shrink-0 hidden lg:block">
                    <div className="bg-card rounded-xl border border-border p-4">
                        <h3 className="text-sm font-bold text-foreground mb-3">🔥 Trending This Week</h3>
                        {trending.length === 0 ? (
                            <p className="text-xs text-muted-foreground">No trending posts yet.</p>
                        ) : (
                            <div className="space-y-2">
                                {trending.map((post, i) => (
                                    <button key={post.id} onClick={() => navigate(`/post/${post.id}`)}
                                        className="w-full text-left group">
                                        <div className="flex gap-2 items-start">
                                            <span className="text-xs text-primary font-bold w-4 shrink-0 mt-0.5">#{i + 1}</span>
                                            <p className="text-xs text-muted-foreground group-hover:text-foreground transition line-clamp-2 leading-snug">{post.title}</p>
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
                    <div className="bg-card text-foreground rounded-xl shadow-xl w-full max-w-md p-6 mx-4 border border-border">
                        <h3 className="text-lg font-semibold text-foreground mb-4">New Category</h3>
                        <form onSubmit={handleCreate} className="space-y-3">
                            <input
                                type="text"
                                value={form.name}
                                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                required
                                className="w-full bg-muted border border-border/50 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="Name"
                            />
                            <input
                                type="text"
                                value={form.description}
                                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                required
                                className="w-full bg-muted border border-border/50 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="Description"
                            />
                            <div className="flex justify-end gap-2 pt-1">
                                <button type="button" onClick={() => setShowModal(false)} className="text-sm px-4 py-2 text-muted-foreground">Cancel</button>
                                <button type="submit" disabled={createMutation.isPending} className="bg-primary px-4 py-2 rounded-lg text-primary-foreground font-medium disabled:opacity-50">
                                    {createMutation.isPending ? 'Creating...' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {editCat && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <div className="bg-card text-foreground rounded-xl shadow-xl w-full max-w-md p-6 mx-4 border border-border">
                        <h3 className="text-lg font-semibold mb-4">Edit Category</h3>
                        <div className="space-y-3">
                            <input value={editName} onChange={e => setEditName(e.target.value)}
                                className="w-full bg-popover border border-border/50 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary" />
                            <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={3}
                                className="w-full bg-popover border border-border/50 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary resize-none" />
                        </div>
                        <div className="flex gap-3 mt-4">
                            <button onClick={handleSaveEdit} disabled={updateMutation.isPending} className="flex-1 py-2 bg-primary hover:bg-primary/90 rounded-lg text-sm font-semibold transition disabled:opacity-50">
                                {updateMutation.isPending ? 'Saving...' : 'Save'}
                            </button>
                            <button onClick={() => setEditCat(null)} className="flex-1 py-2 bg-accent hover:bg-accent/80 rounded-lg text-sm font-semibold transition">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
