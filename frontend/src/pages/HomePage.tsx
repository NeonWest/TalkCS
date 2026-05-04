import { useState } from 'react';
import { useAuth } from '../context/useAuth';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../api/categories';
import { getPosts, getTrendingPosts } from '../api/posts';
import { getTrendingResources } from '../api/resources';
import type { Category } from '../api/categories';
import { useUI } from '../context/useUI';
import { 
    MessageSquare,
    TrendingUp, 
    Hash, 
    Plus, 
    MoreHorizontal, 
    Clock, 
    Trash2,
    Zap,
    Bookmark,
    LayoutGrid,
    Flame,
    ChevronDown,
    Download
} from 'lucide-react';

export default function HomePage() {
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [showModal, setShowModal] = useState(false);
    const { openPostComposer } = useUI();
    const [form, setForm] = useState({ name: '', description: '' });
    const [editCat, setEditCat] = useState<Category | null>(null);
    const [editName, setEditName] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [sortBy, setSortBy] = useState('newest');

    const isAdmin = user?.role === 'ADMIN' || user?.role === 'PROFESSOR';

    // Queries
    const { data: categories = [], isLoading: loadingCategories } = useQuery({
        queryKey: ['categories'],
        queryFn: getCategories,
    });

    const { 
        data: infinitePosts, 
        isLoading: loadingPosts,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage
    } = useInfiniteQuery({
        queryKey: ['globalPosts', sortBy],
        queryFn: ({ pageParam = 0 }) => getPosts(undefined, pageParam, 10, sortBy),
        getNextPageParam: (lastPage) => lastPage.hasNext ? lastPage.currentPage + 1 : undefined,
        initialPageParam: 0,
    });

    const allPosts = infinitePosts?.pages.flatMap(page => page.posts) || [];

    const { data: trending = [] } = useQuery({
        queryKey: ['trendingPosts'],
        queryFn: () => getTrendingPosts(8),
    });

    const { data: trendingResources = [] } = useQuery({
        queryKey: ['trendingResources'],
        queryFn: () => getTrendingResources(5),
    });

    const handleDownloadResource = (resourceId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
        const url = `${baseUrl}/api/resources/${resourceId}/download`;
        
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('target', '_blank');
        link.setAttribute('download', ''); // Suggested by some browsers for force-download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Mutations
    const createMutation = useMutation({
        mutationFn: createCategory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            toast.success('Category created successfully');
            setShowModal(false);
            setForm({ name: '', description: '' });
        },
        onError: () => toast.error('Failed to create category.')
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

    const handleArchiveCat = (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        toast.info('Are you sure?', {
            action: {
                label: 'Archive',
                onClick: () => deleteMutation.mutate(id)
            }
        });
    };

    const handleSaveEdit = () => {
        if (editCat) {
            updateMutation.mutate({ id: editCat.id, data: { name: editName, description: editDesc } });
        }
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        createMutation.mutate(form);
    };

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">

            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex flex-col lg:flex-row gap-10 items-start">
                    
                    {/* Left Column: Explorer */}
                    <aside className="hidden lg:block w-72 shrink-0 space-y-8 sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto no-scrollbar overscroll-contain pb-10">
                        <div className="space-y-4">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-4">Navigation</h3>
                            <nav className="space-y-1">
                                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/10 transition-all">
                                    <Zap size={18} />
                                    Global Feed
                                </button>
                                <button onClick={() => navigate('/leaderboard')} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-muted-foreground hover:bg-secondary font-semibold transition-all group">
                                    <TrendingUp size={18} className="group-hover:text-primary transition-colors" />
                                    Leaderboard
                                </button>
                                <button onClick={() => navigate('/chat')} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-muted-foreground hover:bg-secondary font-semibold transition-all group">
                                    <MessageSquare size={18} className="group-hover:text-primary transition-colors" />
                                    Messages
                                </button>
                            </nav>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-border">
                            <div className="flex items-center justify-between px-4">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">Categories</h3>
                                {isAdmin && (
                                    <button onClick={() => setShowModal(true)} className="text-primary hover:bg-primary/10 p-1.5 rounded-full transition">
                                        <Plus size={16} />
                                    </button>
                                )}
                            </div>
                            <div className="space-y-1">
                                {loadingCategories ? (
                                    Array(5).fill(0).map((_, i) => (
                                        <div key={i} className="h-10 mx-4 bg-muted/50 rounded-xl animate-pulse mb-2" />
                                    ))
                                ) : (
                                    categories.map(cat => (
                                        <div key={cat.id} className="group relative px-2">
                                            <button
                                                onClick={() => navigate(`/category/${cat.id}`)}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-accent hover:text-foreground transition-all group"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                                                    <Hash size={14} />
                                                </div>
                                                <span className="truncate flex-1 text-left">{cat.name}</span>
                                            </button>
                                            {isAdmin && (
                                                <div className="absolute right-4 top-2.5 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                                    <button onClick={(e) => { e.stopPropagation(); setEditCat(cat); setEditName(cat.name); setEditDesc(cat.description); }} className="p-1.5 hover:text-primary bg-background rounded-lg shadow-sm border border-border"><MoreHorizontal size={14} /></button>
                                                    <button onClick={(e) => handleArchiveCat(e, cat.id)} className="p-1.5 hover:text-destructive bg-background rounded-lg shadow-sm border border-border"><Trash2 size={14} /></button>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </aside>

                    {/* Middle Column: Global Feed */}
                    <section className="flex-1 min-w-0 space-y-8">
                        {/* Filters */}
                        <div className="flex items-center justify-between bg-card/30 p-1.5 rounded-[1.25rem] border border-border/50 backdrop-blur-sm">
                            <div className="flex items-center gap-1">
                                <button 
                                    onClick={() => setSortBy('newest')}
                                    className={`flex items-center gap-2 px-6 py-2.5 rounded-[1rem] text-sm font-bold transition-all ${sortBy === 'newest' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground hover:bg-accent'}`}
                                >
                                    <Clock size={16} />
                                    Newest
                                </button>
                                <button 
                                    onClick={() => setSortBy('votes')}
                                    className={`flex items-center gap-2 px-6 py-2.5 rounded-[1rem] text-sm font-bold transition-all ${sortBy === 'votes' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground hover:bg-accent'}`}
                                >
                                    <Flame size={16} />
                                    Popular
                                </button>
                            </div>
                            <div className="flex items-center gap-2 pr-2">
                                <button className="p-2.5 rounded-xl hover:bg-accent text-muted-foreground transition">
                                    <LayoutGrid size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Posts List */}
                        <div className="space-y-6">
                            {isAuthenticated && (
                                <div className="bg-card/40 backdrop-blur-md rounded-[2rem] border border-border p-5 flex items-center gap-4 group cursor-pointer hover:border-primary/40 transition-all shadow-sm hover:shadow-xl hover:shadow-primary/5" onClick={() => openPostComposer()}>
                                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all shadow-inner shadow-primary/5">
                                        <Plus size={24} strokeWidth={3} />
                                    </div>
                                    <div className="flex-1 bg-secondary/20 rounded-2xl px-6 py-3 text-sm font-bold text-muted-foreground group-hover:bg-secondary/40 transition-all border border-transparent group-hover:border-border/50">
                                        What's on your mind today? Start a discussion...
                                    </div>
                                </div>
                            )}
                            {loadingPosts ? (
                                Array(5).fill(0).map((_, i) => (
                                    <div key={i} className="h-56 bg-card/50 rounded-[2rem] border border-border animate-pulse" />
                                ))
                            ) : allPosts.length === 0 ? (
                                <div className="bg-card/30 backdrop-blur-xl rounded-[2.5rem] border-2 border-dashed border-border p-20 text-center space-y-4">
                                    <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto text-muted-foreground">
                                        <MessageSquare size={40} />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-bold">No discussions found</h3>
                                        <p className="text-muted-foreground">Be the pioneer and start the first conversation!</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {allPosts.map(post => (
                                        <article 
                                            key={post.id}
                                            onClick={() => navigate(`/post/${post.id}`)}
                                            className="group bg-card hover:bg-accent/10 rounded-2xl sm:rounded-[2.5rem] border border-border p-4 sm:p-6 transition-all cursor-pointer shadow-sm hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1 relative"
                                        >
                                            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                                                {/* Voting Sidebar on card - Desktop */}
                                                <div className="hidden sm:flex flex-col items-center justify-center gap-2 bg-secondary/50 rounded-2xl px-3 py-4 self-start group-hover:bg-primary/10 transition-colors">
                                                    <button className="text-muted-foreground hover:text-primary transition-colors"><Plus size={18} /></button>
                                                    <span className="text-base font-black text-foreground">{post.voteScore}</span>
                                                    <button className="text-muted-foreground hover:text-blue-500 transition-colors"><MoreHorizontal size={18} /></button>
                                                </div>

                                                <div className="flex-1 min-w-0 space-y-3 sm:space-y-4">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-xl sm:rounded-2xl bg-primary/20 flex items-center justify-center text-primary font-black shadow-inner shadow-primary/10 text-xs sm:text-base">
                                                                {post.authorUsername.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div className="flex flex-col min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs sm:text-sm font-bold text-foreground truncate hover:underline decoration-primary decoration-2 underline-offset-4">{post.authorUsername}</span>
                                                                    <span className="px-1.5 py-0.5 rounded-lg bg-secondary text-[8px] sm:text-[10px] font-black text-muted-foreground uppercase shrink-0">{post.authorLevel}</span>
                                                                </div>
                                                                <span className="text-[10px] sm:text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                                                                    <Clock size={10} />
                                                                    {new Date(post.createdAt).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <span className="bg-primary/10 text-primary text-[8px] sm:text-[10px] font-black px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl uppercase tracking-widest border border-primary/20 shrink-0">
                                                            {post.categoryName}
                                                        </span>
                                                    </div>

                                                    <div className="space-y-1 sm:space-y-2">
                                                        <h3 className="text-lg sm:text-2xl font-black text-foreground group-hover:text-primary transition-colors leading-tight line-clamp-2">
                                                            {post.title}
                                                        </h3>
                                                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 sm:line-clamp-3 leading-relaxed font-medium">
                                                            {post.body.replace(/[#*`]/g, '')}
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center justify-between sm:justify-start gap-4 sm:gap-6 pt-2 border-t sm:border-t-0 border-border/50">
                                                        <div className="flex items-center gap-4 sm:gap-6">
                                                            <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground transition-colors">
                                                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-secondary flex items-center justify-center group-hover:bg-primary/20 group-hover:text-primary transition-all">
                                                                    <MessageSquare size={14} className="sm:size-16" />
                                                                </div>
                                                                <span className="text-[10px] sm:text-xs font-black">{post.commentCount} <span className="hidden xs:inline">Comments</span></span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground transition-colors">
                                                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-secondary flex items-center justify-center group-hover:bg-blue-500/20 group-hover:text-blue-500 transition-all">
                                                                    <Bookmark size={14} className="sm:size-16" />
                                                                </div>
                                                                <span className="text-[10px] sm:text-xs font-black">Save</span>
                                                            </div>
                                                        </div>

                                                        {/* Voting row on card - Mobile */}
                                                        <div className="flex sm:hidden items-center gap-2 bg-secondary/50 rounded-xl px-2 py-1">
                                                            <button className="text-muted-foreground hover:text-primary transition-colors p-1"><Plus size={14} /></button>
                                                            <span className="text-xs font-black text-foreground">{post.voteScore}</span>
                                                            <button className="text-muted-foreground hover:text-blue-500 transition-colors p-1"><MoreHorizontal size={14} /></button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </article>
                                    ))}

                                    {hasNextPage && (
                                        <div className="pt-8 pb-12 flex justify-center">
                                            <button
                                                onClick={() => fetchNextPage()}
                                                disabled={isFetchingNextPage}
                                                className="group flex items-center gap-3 bg-secondary/30 hover:bg-primary/10 border border-border hover:border-primary/30 px-10 py-4 rounded-[2rem] transition-all font-black text-sm text-muted-foreground hover:text-primary shadow-lg hover:shadow-primary/5 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                                            >
                                                {isFetchingNextPage ? (
                                                    <>
                                                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                                        Discovering more...
                                                    </>
                                                ) : (
                                                    <>
                                                        <ChevronDown size={18} className="group-hover:translate-y-0.5 transition-transform" />
                                                        Load More Discussions
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </section>

                    {/* Right Column: Community & Trending */}
                    <aside className="hidden lg:block w-80 shrink-0 space-y-8 sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto no-scrollbar overscroll-contain pb-10">
                        <div className="bg-card/50 backdrop-blur-xl rounded-[2rem] border border-border p-6 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16" />
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-2 mb-6">
                                <TrendingUp size={16} className="text-primary" />
                                Trending Topics
                            </h3>
                            <div className="space-y-6">
                                {trending.map((post, i) => (
                                    <button 
                                        key={post.id} 
                                        onClick={() => navigate(`/post/${post.id}`)}
                                        className="w-full text-left group flex gap-4 items-start"
                                    >
                                        <span className="text-2xl font-black text-primary/10 group-hover:text-primary/40 transition-colors">
                                            #{i + 1}
                                        </span>
                                        <div className="min-w-0 space-y-1">
                                            <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                                                {post.title}
                                            </p>
                                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold">
                                                <span className="flex items-center gap-1"><MessageSquare size={10} /> {post.commentCount}</span>
                                                <span>•</span>
                                                <span className="flex items-center gap-1"><TrendingUp size={10} /> {post.voteScore} pts</span>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-card/50 backdrop-blur-xl rounded-[2rem] border border-border p-6 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16" />
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-2 mb-6">
                                <Download size={16} className="text-primary" />
                                Trending Resources
                            </h3>
                            <div className="space-y-6">
                                {trendingResources.length > 0 ? (
                                    trendingResources.map((res) => (
                                        <div 
                                            key={res.id} 
                                            className="w-full text-left group flex gap-4 items-start p-2 -m-2 rounded-2xl transition-all hover:bg-secondary/30"
                                        >
                                            <button 
                                                onClick={(e) => handleDownloadResource(res.id, e)}
                                                className="w-10 h-10 shrink-0 rounded-xl bg-secondary/80 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-sm"
                                                title="Direct Download"
                                            >
                                                <Download size={18} />
                                            </button>
                                            <div 
                                                className="min-w-0 flex-1 space-y-1 cursor-pointer"
                                                onClick={() => navigate(`/category/${res.categoryId}`, { state: { activeTab: 'resources' } })}
                                            >
                                                <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                                                    {res.title}
                                                </p>
                                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                                                    <span>{res.fileType.split('/')[1]?.toUpperCase() || 'FILE'}</span>
                                                    <span>•</span>
                                                    <span>{res.voteScore} pts</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs font-bold text-muted-foreground/60 italic px-2">No resources found</p>
                                )}
                            </div>
                        </div>

                        <div className="px-6 text-[11px] text-muted-foreground/60 flex flex-wrap gap-x-4 gap-y-2 font-bold uppercase tracking-widest">
                            <a href="#" className="hover:text-primary transition">About</a>
                            <a href="#" className="hover:text-primary transition">Privacy</a>
                            <a href="#" className="hover:text-primary transition">Terms</a>
                            <span className="w-full mt-2">© 2026 TalkCS Engine</span>
                        </div>
                    </aside>
                </div>
            </main>

            {/* Modals for Category Management */}

            {showModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-50 p-4">
                    <div className="bg-card text-foreground rounded-[2.5rem] shadow-2xl w-full max-w-md p-8 border border-border animate-in zoom-in-95 duration-300">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                                <Plus size={24} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-foreground">New Category</h3>
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Organize the community</p>
                            </div>
                        </div>
                        <form onSubmit={handleCreate} className="space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Name</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                    required
                                    className="w-full bg-secondary/50 border border-border rounded-2xl px-5 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                                    placeholder="e.g. Frontend Architecture"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Description</label>
                                <textarea
                                    value={form.description}
                                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                    required
                                    rows={3}
                                    className="w-full bg-secondary/50 border border-border rounded-2xl px-5 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
                                    placeholder="Tell everyone what this category is for..."
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 text-sm font-bold text-muted-foreground hover:bg-secondary rounded-2xl transition">Cancel</button>
                                <button type="submit" disabled={createMutation.isPending} className="bg-primary px-8 py-3 rounded-2xl text-primary-foreground font-black shadow-xl shadow-primary/20 disabled:opacity-50">
                                    {createMutation.isPending ? 'Creating...' : 'Create Category'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {editCat && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-50 p-4">
                    <div className="bg-card text-foreground rounded-[2.5rem] shadow-2xl w-full max-w-md p-8 border border-border animate-in zoom-in-95 duration-300">
                        <h3 className="text-2xl font-black mb-8">Edit Category</h3>
                        <div className="space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Name</label>
                                <input value={editName} onChange={e => setEditName(e.target.value)}
                                    className="w-full bg-secondary/50 border border-border rounded-2xl px-5 py-3 font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Description</label>
                                <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={3}
                                    className="w-full bg-secondary/50 border border-border rounded-2xl px-5 py-3 font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
                            </div>
                        </div>
                        <div className="flex gap-4 mt-10">
                            <button onClick={handleSaveEdit} disabled={updateMutation.isPending} className="flex-1 py-3.5 bg-primary rounded-2xl text-sm font-black text-primary-foreground shadow-xl shadow-primary/20 transition disabled:opacity-50">
                                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button onClick={() => setEditCat(null)} className="flex-1 py-3.5 bg-secondary hover:bg-secondary/80 rounded-2xl text-sm font-black transition">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
