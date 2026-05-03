import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { usePostUpdates } from '../hooks/usePostUpdates';
import { getCategoryById } from '../api/categories';
import { getPosts, updatePost, deletePost } from '../api/posts';
import { getResources, uploadResource, deleteResource, voteOnResource } from '../api/resources';
import { voteOnPost, getVoteErrorMessage } from '../api/votes';
import type { Post } from '../api/posts';
import type { ResourceItem } from '../api/resources';
import { useUI } from '../context/useUI';
import MarkdownEditor from '../components/MarkdownEditor';
import { getUpcomingEvents, type CalendarEvent } from '../api/calendar';
import { Button } from '../components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';

function stripMarkdown(text: string, maxLen = 150): string {
    const stripped = text
        .replace(/```[\s\S]*?```/g, '')
        .replace(/`[^`]*`/g, '')
        .replace(/!\[.*?\]\(.*?\)/g, '')
        .replace(/\[([^\]]+)\]\(.*?\)/g, '$1')
        .replace(/^#+\s+/gm, '')
        .replace(/(\*\*|__)(.*?)\1/g, '$2')
        .replace(/(\*|_)(.*?)\1/g, '$2')
        .replace(/~~(.*?)~~/g, '$1')
        .replace(/^\s*[-*+>]\s+/gm, '')
        .replace(/\n+/g, ' ')
        .trim();
    return stripped.length > maxLen ? stripped.slice(0, maxLen) + '…' : stripped;
}

export default function CategoryPage() {
    const { id } = useParams<{ id: string }>();
    const categoryId = Number(id);
    const navigate = useNavigate();
    const { user, isAuthenticated, token } = useAuth();

    usePostUpdates(
        id,
        token,
        (post) => setPosts(prev => [post, ...prev]),
        (post) => setPosts(prev => prev.map(p => p.id === post.id ? post : p)),
        (postId) => setPosts(prev => prev.filter(p => p.id !== postId))
    );

    const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);

    const [categoryName, setCategoryName] = useState('');
    const [categoryDescription, setCategoryDescription] = useState('');
    const [posts, setPosts] = useState<Post[]>([]);
    const [resources, setResources] = useState<ResourceItem[]>([]);
    const [loading, setLoading] = useState(true);
    const { openPostComposer } = useUI();
    const [showResourceModal, setShowResourceModal] = useState(false);
    const [resourceForm, setResourceForm] = useState({ title: '', description: '', file: null as File | null });
    const [uploadingResource, setUploadingResource] = useState(false);
    const [editingPost, setEditingPost] = useState<Post | null>(null);
    const [editForm, setEditForm] = useState({ title: '', body: '', tags: [] as string[] });
    const [editTagInput, setEditTagInput] = useState('');
    const [savingEdit, setSavingEdit] = useState(false);
    const [deletingPostId, setDeletingPostId] = useState<number | null>(null);
    const [deletingResourceId, setDeletingResourceId] = useState<number | null>(null);
    const [votingPostId, setVotingPostId] = useState<number | null>(null);
    const [votingResourceId, setVotingResourceId] = useState<number | null>(null);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<'posts' | 'resources'>('posts');
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [hasNext, setHasNext] = useState(false);
    const [hasPrevious, setHasPrevious] = useState(false);
    const [sortBy, setSortBy] = useState<'newest' | 'votes' | 'comments'>('newest');

    const PAGE_SIZE = 10;

    const refreshPosts = async () => {
        const updated = await getPosts(categoryId, currentPage, PAGE_SIZE, sortBy);
        setPosts(updated.posts);
        setCurrentPage(updated.currentPage);
        setTotalPages(updated.totalPages);
        setHasNext(updated.hasNext);
        setHasPrevious(updated.hasPrevious);
    };

    const refreshResources = async () => {
        const updated = await getResources(categoryId);
        setResources(updated);
    };

    useEffect(() => {
        getCategoryById(categoryId)
            .then(c => {
                setCategoryName(c.name);
                setCategoryDescription(c.description);
            })
            .finally(() => setLoading(false));
    }, [categoryId]);

    useEffect(() => {
        getUpcomingEvents(categoryId, 5)
            .then(data => setUpcomingEvents(data.events))
            .catch(() => {});
    }, [categoryId]);

    useEffect(() => {
        setLoading(true);

        const loader = activeTab === 'posts'
            ? getPosts(categoryId, currentPage, PAGE_SIZE, sortBy).then((data) => {
                setPosts(data.posts);
                setCurrentPage(data.currentPage);
                setTotalPages(data.totalPages);
                setHasNext(data.hasNext);
                setHasPrevious(data.hasPrevious);
            })
            : getResources(categoryId).then(setResources);

        loader.finally(() => setLoading(false));
    }, [categoryId, currentPage, sortBy, activeTab]);

    const handleUploadResource = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!resourceForm.file) {
            setError('Please choose a file to upload.');
            return;
        }

        setError('');
        setUploadingResource(true);
        try {
            await uploadResource(resourceForm.file, resourceForm.title, resourceForm.description, categoryId);
            await refreshResources();
            setResourceForm({ title: '', description: '', file: null });
            setShowResourceModal(false);
        } catch (err) {
            setError(getVoteErrorMessage(err));
        } finally {
            setUploadingResource(false);
        }
    };

    const openEditModal = (post: Post) => {
        setError('');
        setEditingPost(post);
        setEditForm({ title: post.title, body: post.body, tags: post.tags ?? [] });
        setEditTagInput('');
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
                tags: editForm.tags,
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

    const handleDeleteResource = async (resource: ResourceItem, e: React.MouseEvent) => {
        e.stopPropagation();
        const confirmed = window.confirm('Delete this resource? This action cannot be undone.');
        if (!confirmed) return;

        setError('');
        setDeletingResourceId(resource.id);
        try {
            await deleteResource(resource.id);
            setResources(prev => prev.filter(r => r.id !== resource.id));
        } catch (err) {
            setError(getVoteErrorMessage(err));
        } finally {
            setDeletingResourceId(null);
        }
    };

    const handleVotePost = async (postId: number, value: 1 | -1, e: React.MouseEvent) => {
        e.stopPropagation();
        setError('');
        setVotingPostId(postId);
        try {
            await voteOnPost(postId, value);
            await refreshPosts();
        } catch (err) {
            setError(getVoteErrorMessage(err));
        } finally {
            setVotingPostId(null);
        }
    };

    const handleVoteResource = async (resourceId: number, value: 1 | -1, e: React.MouseEvent) => {
        e.stopPropagation();
        setError('');
        setVotingResourceId(resourceId);
        try {
            await voteOnResource(resourceId, value);
            await refreshResources();
        } catch (err) {
            setError(getVoteErrorMessage(err));
        } finally {
            setVotingResourceId(null);
        }
    };

    const handleDownloadResource = (resourceId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        window.open(`http://localhost:8080/api/resources/${resourceId}/download`, '_blank');
    };

    return (
        <div className="min-h-screen bg-background text-foreground">

            <main className="max-w-5xl mx-auto px-4 py-6 flex flex-col lg:flex-row lg:gap-6">
                <div className="flex-1 min-w-0">
                <div className="rounded-xl shadow-sm border border-border bg-card mb-6 overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-primary via-primary/80 to-primary" />
                    <div className="p-4 sm:p-5">
                        <h2 className="text-xl sm:text-2xl font-bold text-foreground">{categoryName || 'Loading...'}</h2>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">{categoryDescription || 'General discussion space'}</p>
                        {isAuthenticated && (
                            <button
                                onClick={() => activeTab === 'posts' ? openPostComposer(categoryId) : setShowResourceModal(true)}
                                className="w-full sm:w-auto mt-4 text-sm bg-primary text-white hover:bg-primary/90 px-6 py-2 rounded-xl transition font-bold shadow-lg shadow-primary/20"
                            >
                                {activeTab === 'posts' ? '+ New Post' : '+ Upload Resource'}
                            </button>
                        )}
                    </div>
                </div>

                <div className="mb-6 flex items-center gap-2 bg-background p-1 rounded-xl w-fit border border-border">
                    <button
                        onClick={() => setActiveTab('posts')}
                        className={`text-sm px-4 py-1.5 rounded-lg transition font-medium ${activeTab === 'posts' ? 'bg-primary text-white shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Posts
                    </button>
                    <button
                        onClick={() => setActiveTab('resources')}
                        className={`text-sm px-4 py-1.5 rounded-lg transition font-medium ${activeTab === 'resources' ? 'bg-primary text-white shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Resources
                    </button>
                </div>

                {error && <p className="text-sm text-destructive mb-4 bg-destructive/10 border border-destructive/20 px-4 py-2 rounded-lg">{error}</p>}

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-muted-foreground">Loading {activeTab}...</p>
                    </div>
                ) : activeTab === 'posts' && posts.length === 0 ? (
                    <div className="bg-background rounded-xl shadow-sm p-12 text-center text-muted-foreground border border-border">
                        No posts yet. Be the first to post!
                    </div>
                ) : activeTab === 'resources' && resources.length === 0 ? (
                    <div className="bg-background rounded-xl shadow-sm p-12 text-center text-muted-foreground border border-border">
                        No resources yet. Upload the first file!
                    </div>
                ) : (
                    <>
                        {activeTab === 'posts' && (
                            <>
                                <div className="mb-4 flex items-center justify-end">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                        Sort by
                                        <select
                                            value={sortBy}
                                            onChange={(e) => {
                                                const value = e.target.value as 'newest' | 'votes' | 'comments';
                                                setSortBy(value);
                                                setCurrentPage(0);
                                            }}
                                            className="bg-muted border border-border rounded-lg px-2 py-1.5 text-xs text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                        >
                                            <option value="newest">Newest</option>
                                            <option value="votes">Most Voted</option>
                                            <option value="comments">Most Commented</option>
                                        </select>
                                    </label>
                                </div>

                                <div className="space-y-3">
                                    {posts.map(post => (
                                        <div
                                            key={post.id}
                                            onClick={() => navigate(`/post/${post.id}?categoryId=${categoryId}`, { state: { categoryId } })}
                                            className="bg-card rounded-xl shadow-sm border border-border px-4 py-4 hover:shadow-md hover:-translate-y-0.5 transition cursor-pointer"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-lg font-bold text-primary truncate mb-1">{post.title}</p>
                                                    {post.body && (
                                                        <p className="text-sm text-muted-foreground line-clamp-2">{stripMarkdown(post.body)}</p>
                                                    )}
                                                    <div className="text-xs text-muted-foreground mt-3 flex items-center gap-2 flex-wrap">
                                                        <div className="flex items-center gap-2 pr-2 border-r border-border">
                                                            <div className="h-6 w-6 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-bold">
                                                                {post.authorUsername.charAt(0).toUpperCase()}
                                                            </div>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    navigate(`/profile/${post.authorUsername}`);
                                                                }}
                                                                className="text-foreground hover:text-foreground/70 transition font-bold"
                                                            >
                                                                {post.authorUsername}
                                                            </button>
                                                        </div>
                                                        <span className="hidden sm:inline">•</span>
                                                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                                                        <span className="hidden sm:inline">•</span>
                                                        <span className="font-bold text-primary/80">{post.commentCount} comments</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0 bg-muted/60 px-2 py-1 rounded-lg">
                                                    <button
                                                        onClick={(e) => void handleVotePost(post.id, 1, e)}
                                                        disabled={votingPostId === post.id}
                                                        className={`text-sm transition ${post.userVote === 1 ? 'text-primary' : 'text-muted-foreground hover:text-foreground'} disabled:opacity-50`}
                                                    >
                                                        ▲
                                                    </button>
                                                    <span className="text-sm font-bold text-foreground w-6 text-center">{post.voteScore ?? 0}</span>
                                                    <button
                                                        onClick={(e) => void handleVotePost(post.id, -1, e)}
                                                        disabled={votingPostId === post.id}
                                                        className={`text-sm transition ${post.userVote === -1 ? 'text-blue-400' : 'text-muted-foreground hover:text-foreground'} disabled:opacity-50`}
                                                    >
                                                        ▼
                                                    </button>
                                                </div>
                                            </div>

                                            {(user?.username === post.authorUsername || user?.role === 'ADMIN') && (
                                                <div className="mt-4 pt-3 border-t border-border flex items-center gap-1">
                                                    {user?.username === post.authorUsername && (
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            onClick={(e) => { e.stopPropagation(); openEditModal(post); }}
                                                            title="Edit post"
                                                            className="hover:bg-black/10 dark:hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                                                        >
                                                            <Pencil size={15} strokeWidth={2} />
                                                        </Button>
                                                    )}
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={(e) => { e.stopPropagation(); void handleDelete(post); }}
                                                        disabled={deletingPostId === post.id}
                                                        title="Delete post"
                                                        className="hover:bg-black/10 dark:hover:bg-accent text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                                                    >
                                                        <Trash2 size={15} strokeWidth={2} />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-6 flex items-center justify-center gap-3">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                                        disabled={!hasPrevious}
                                        className="text-sm px-3 py-1.5 rounded border border-border text-muted-foreground hover:bg-accent/50 transition disabled:opacity-50"
                                    >
                                        Previous
                                    </button>
                                    <span className="text-sm text-muted-foreground">
                                        Page {totalPages === 0 ? 0 : currentPage + 1} of {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setCurrentPage(prev => prev + 1)}
                                        disabled={!hasNext}
                                        className="text-sm px-3 py-1.5 rounded border border-border text-muted-foreground hover:bg-accent/50 transition disabled:opacity-50"
                                    >
                                        Next
                                    </button>
                                </div>
                            </>
                        )}

                        {activeTab === 'resources' && (
                            <div className="space-y-2.5">
                                {resources.map(resource => (
                                    <div key={resource.id} className="bg-card rounded-xl shadow-sm border border-border px-4 py-3">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-lg font-semibold text-primary truncate">{resource.title}</p>
                                                <p className="text-sm text-muted-foreground mt-1">{resource.description}</p>
                                                <div className="text-sm text-muted-foreground mt-2 flex items-center gap-2.5 flex-wrap">
                                                    <span className="font-medium text-foreground">{resource.uploaderUsername}</span>
                                                    <span>•</span>
                                                    <span>{resource.fileName}</span>
                                                    <span>•</span>
                                                    <span>{new Date(resource.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <button
                                                    onClick={(e) => void handleVoteResource(resource.id, 1, e)}
                                                    disabled={votingResourceId === resource.id}
                                                    className={`text-sm transition ${resource.userVote === 1 ? 'text-primary' : 'text-muted-foreground hover:text-foreground'} disabled:opacity-50`}
                                                >
                                                    ▲
                                                </button>
                                                <span className="text-sm font-semibold text-foreground w-6 text-center">{resource.voteScore ?? 0}</span>
                                                <button
                                                    onClick={(e) => void handleVoteResource(resource.id, -1, e)}
                                                    disabled={votingResourceId === resource.id}
                                                    className={`text-sm transition ${resource.userVote === -1 ? 'text-blue-400' : 'text-muted-foreground hover:text-foreground'} disabled:opacity-50`}
                                                >
                                                    ▼
                                                </button>
                                                <button
                                                    onClick={(e) => handleDownloadResource(resource.id, e)}
                                                    className="text-xs px-3 py-1.5 rounded border border-border text-foreground hover:bg-accent/50 transition"
                                                >
                                                    Download
                                                </button>
                                                {(user?.username === resource.uploaderUsername || user?.role === 'ADMIN' || user?.role === 'PROFESSOR') && (
                                                    <button
                                                        onClick={(e) => void handleDeleteResource(resource, e)}
                                                        disabled={deletingResourceId === resource.id}
                                                        className="text-xs px-3 py-1.5 rounded border border-destructive/40 text-destructive hover:bg-destructive/10 transition disabled:opacity-50"
                                                    >
                                                        {deletingResourceId === resource.id ? 'Deleting...' : 'Delete'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
                </div>{/* end flex-1 */}

                {/* Upcoming events sidebar */}
                <aside className="w-full lg:w-64 shrink-0 mt-8 lg:mt-0">
                    <div className="bg-card rounded-xl border border-border p-4 lg:sticky lg:top-20">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Upcoming Events</h3>
                            <button
                                onClick={() => navigate('/calendar')}
                                className="text-xs text-primary hover:text-primary/80 font-bold transition"
                            >View all</button>
                        </div>
                        {upcomingEvents.length === 0 ? (
                            <p className="text-xs text-muted-foreground py-4 text-center border border-dashed border-border rounded-lg">No upcoming events.</p>
                        ) : (
                            <div className="space-y-3">
                                {upcomingEvents.map(ev => (
                                    <div key={ev.id} className="bg-muted/40 rounded-lg p-2.5 border-l-4 border-primary transition hover:bg-muted/70">
                                        <p className="text-xs font-bold text-foreground leading-snug truncate mb-1">{ev.title}</p>
                                        <div className="flex items-center justify-between text-[10px]">
                                            <span className="text-muted-foreground">{ev.startDate}</span>
                                            <span className="text-primary/80 font-bold">{ev.eventType}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <button
                            onClick={() => navigate('/calendar')}
                            className="mt-4 w-full py-2 text-xs font-bold text-muted-foreground hover:text-foreground bg-muted/40 hover:bg-muted/70 rounded-lg transition border border-border"
                        >+ Add your own event</button>
                    </div>
                </aside>
            </main>

            {editingPost && (
                <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
                    <div className="bg-card text-foreground rounded-xl shadow-xl w-full max-w-2xl p-6 border border-border">
                        <h3 className="text-lg font-semibold text-foreground mb-4">Edit Post</h3>
                        <form onSubmit={handleEdit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">Title</label>
                                <input
                                    id="edit-post-title"
                                    type="text"
                                    value={editForm.title}
                                    onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))}
                                    required
                                    className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">Body</label>
                                <MarkdownEditor
                                    value={editForm.body}
                                    onChange={v => setEditForm(p => ({ ...p, body: v }))}
                                    rows={5}
                                    placeholder="Edit your post..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">Tags</label>
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                    {editForm.tags.map(tag => (
                                        <span key={tag} className="flex items-center gap-1 px-2 py-0.5 bg-primary/20 text-primary rounded-full text-xs">
                                            {tag}
                                            <button type="button" onClick={() => setEditForm(p => ({ ...p, tags: p.tags.filter(t => t !== tag) }))} className="hover:text-white">×</button>
                                        </span>
                                    ))}
                                </div>
                                <input
                                    type="text"
                                    value={editTagInput}
                                    onChange={e => setEditTagInput(e.target.value)}
                                    onKeyDown={e => {
                                        if ((e.key === 'Enter' || e.key === ',') && editTagInput.trim()) {
                                            e.preventDefault();
                                            const tag = editTagInput.trim().toLowerCase();
                                            if (!editForm.tags.includes(tag)) setEditForm(p => ({ ...p, tags: [...editForm.tags, tag] }));
                                            setEditTagInput('');
                                        }
                                    }}
                                    placeholder="Type a tag and press Enter"
                                    className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>
                            {error && <p className="text-sm text-destructive">{error}</p>}
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditingPost(null);
                                        setError('');
                                    }}
                                    className="text-sm px-4 py-2 rounded-lg border border-border text-muted-foreground hover:bg-accent/50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingEdit}
                                    className="text-sm px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white font-medium transition disabled:opacity-50"
                                >
                                    {savingEdit ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showResourceModal && (
                <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
                    <div className="bg-card text-foreground rounded-xl shadow-xl w-full max-w-2xl p-6 border border-border">
                        <h3 className="text-lg font-semibold text-foreground mb-4">Upload Resource</h3>
                        <form onSubmit={handleUploadResource} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">Title</label>
                                <input
                                    type="text"
                                    value={resourceForm.title}
                                    onChange={(e) => setResourceForm((p) => ({ ...p, title: e.target.value }))}
                                    required
                                    className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="Resource title"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">Description</label>
                                <textarea
                                    value={resourceForm.description}
                                    onChange={(e) => setResourceForm((p) => ({ ...p, description: e.target.value }))}
                                    required
                                    rows={4}
                                    className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                                    placeholder="What is this file about?"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">File</label>
                                <input
                                    type="file"
                                    required
                                    onChange={(e) => setResourceForm((p) => ({ ...p, file: e.target.files?.[0] ?? null }))}
                                    className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-sm"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowResourceModal(false);
                                        setError('');
                                    }}
                                    className="text-sm px-4 py-2 rounded-lg border border-border text-muted-foreground hover:bg-accent/50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={uploadingResource}
                                    className="text-sm px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white font-medium transition disabled:opacity-50"
                                >
                                    {uploadingResource ? 'Uploading...' : 'Upload'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
