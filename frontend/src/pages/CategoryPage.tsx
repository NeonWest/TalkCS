import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCategoryById } from '../api/categories';
import { getPosts, createPost, updatePost, deletePost, getSimilarPosts } from '../api/posts';
import type { SimilarPost } from '../api/posts';
import { getResources, uploadResource, deleteResource, voteOnResource } from '../api/resources';
import { voteOnPost, getVoteErrorMessage } from '../api/votes';
import type { Post } from '../api/posts';
import type { ResourceItem } from '../api/resources';
import NavbarSearch from '../components/NavbarSearch';
import MarkdownEditor from '../components/MarkdownEditor';
import { suggestTags } from '../api/tags';

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
    const { user, logout, isAuthenticated } = useAuth();

    const [categoryName, setCategoryName] = useState('');
    const [categoryDescription, setCategoryDescription] = useState('');
    const [posts, setPosts] = useState<Post[]>([]);
    const [resources, setResources] = useState<ResourceItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showResourceModal, setShowResourceModal] = useState(false);
    const [form, setForm] = useState({ title: '', body: '', tags: [] as string[] });
    const [formTagInput, setFormTagInput] = useState('');
    const [resourceForm, setResourceForm] = useState({ title: '', description: '', file: null as File | null });
    const [creating, setCreating] = useState(false);
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
    const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
    const [similarPosts, setSimilarPosts] = useState<SimilarPost[]>([]);
    const suggestTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const similarTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    useEffect(() => {
        if (!showModal) return;
        if (suggestTimer.current) clearTimeout(suggestTimer.current);
        suggestTimer.current = setTimeout(async () => {
            if (!form.title && !form.body) { setTagSuggestions([]); return; }
            try {
                const suggestions = await suggestTags(form.title, form.body);
                setTagSuggestions(suggestions.filter(s => !form.tags.includes(s)));
            } catch { /* ignore */ }
        }, 500);
        return () => { if (suggestTimer.current) clearTimeout(suggestTimer.current); };
    }, [form.title, form.body, showModal]);

    useEffect(() => {
        if (!showModal) return;
        if (similarTimer.current) clearTimeout(similarTimer.current);
        similarTimer.current = setTimeout(async () => {
            if (!form.title.trim()) { setSimilarPosts([]); return; }
            try {
                const results = await getSimilarPosts(form.title, form.body, categoryId, form.tags);
                setSimilarPosts(results);
            } catch { /* ignore */ }
        }, 500);
        return () => { if (similarTimer.current) clearTimeout(similarTimer.current); };
    }, [form.title, form.body, showModal]);

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
            const created = await createPost({ ...form, categoryId });
            setPosts(prev => [created, ...prev]);
            setForm({ title: '', body: '', tags: [] });
            setFormTagInput('');
            setShowModal(false);
        } catch {
            setError('Failed to create post.');
        } finally {
            setCreating(false);
        }
    };

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
        <div className="min-h-screen bg-[#1f1f1f] text-gray-100">
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
                    <NavbarSearch />
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
                <div className="rounded-none md:rounded-xl shadow-sm border border-white/10 bg-[#343434] mb-6 overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500" />
                    <div className="p-5">
                        <h2 className="text-2xl font-bold text-gray-100">{categoryName || 'Loading...'}</h2>
                        <p className="text-sm text-gray-300 mt-1">{categoryDescription || 'General discussion space'}</p>
                        {isAuthenticated && (
                            <button
                                onClick={() => activeTab === 'posts' ? setShowModal(true) : setShowResourceModal(true)}
                                className="mt-4 text-sm bg-orange-500 text-white hover:bg-orange-600 px-4 py-1.5 rounded-xl transition font-semibold shadow-sm"
                            >
                                {activeTab === 'posts' ? '+ New Post' : '+ Upload Resource'}
                            </button>
                        )}
                    </div>
                </div>

                <div className="mb-4 flex items-center gap-2">
                    <button
                        onClick={() => setActiveTab('posts')}
                        className={`text-sm px-3 py-1.5 rounded-lg border transition ${activeTab === 'posts' ? 'bg-orange-500 text-white border-orange-500' : 'border-white/20 text-gray-300 hover:bg-white/10'}`}
                    >
                        Posts
                    </button>
                    <button
                        onClick={() => setActiveTab('resources')}
                        className={`text-sm px-3 py-1.5 rounded-lg border transition ${activeTab === 'resources' ? 'bg-orange-500 text-white border-orange-500' : 'border-white/20 text-gray-300 hover:bg-white/10'}`}
                    >
                        Resources
                    </button>
                </div>

                {error && <p className="text-base text-red-400 mb-4">{error}</p>}

                {loading ? (
                    <p className="text-base text-gray-400">Loading...</p>
                ) : activeTab === 'posts' && posts.length === 0 ? (
                    <div className="bg-[#101010] rounded-xl shadow-sm p-12 text-center text-gray-400 border border-white/10">
                        No posts yet. Be the first to post!
                    </div>
                ) : activeTab === 'resources' && resources.length === 0 ? (
                    <div className="bg-[#101010] rounded-xl shadow-sm p-12 text-center text-gray-400 border border-white/10">
                        No resources yet. Upload the first file!
                    </div>
                ) : (
                    <>
                        {activeTab === 'posts' && (
                            <>
                                <div className="mb-3 flex items-center justify-end">
                                    <label className="text-sm text-gray-300 flex items-center gap-2">
                                        Sort by
                                        <select
                                            value={sortBy}
                                            onChange={(e) => {
                                                const value = e.target.value as 'newest' | 'votes' | 'comments';
                                                setSortBy(value);
                                                setCurrentPage(0);
                                            }}
                                            className="bg-[#242424] border border-white/15 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                                        >
                                            <option value="newest">Newest</option>
                                            <option value="votes">Most Voted</option>
                                            <option value="comments">Most Commented</option>
                                        </select>
                                    </label>
                                </div>

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
                                                    {post.body && (
                                                        <p className="text-sm text-gray-400 mt-1 line-clamp-2">{stripMarkdown(post.body)}</p>
                                                    )}
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
                                                        {post.authorLevel && (
                                                            <span className="px-1.5 py-0.5 bg-orange-500/15 text-orange-400 rounded text-xs">{post.authorLevel}</span>
                                                        )}
                                                        <span>•</span>
                                                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                                                        <span>•</span>
                                                        <span className="font-semibold">{post.commentCount} comments</span>
                                                    </div>
                                                    {post.tags && post.tags.length > 0 && (
                                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                                            {post.tags.map(tag => (
                                                                <span key={tag} className="px-2 py-0.5 bg-orange-500/15 text-orange-300 rounded-full text-xs">{tag}</span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <button
                                                        onClick={(e) => void handleVotePost(post.id, 1, e)}
                                                        disabled={votingPostId === post.id}
                                                        className={`text-sm transition ${post.userVote === 1 ? 'text-orange-400' : 'text-gray-400 hover:text-gray-200'} disabled:opacity-50`}
                                                    >
                                                        ▲
                                                    </button>
                                                    <span className="text-sm font-semibold text-gray-200 w-6 text-center">{post.voteScore ?? 0}</span>
                                                    <button
                                                        onClick={(e) => void handleVotePost(post.id, -1, e)}
                                                        disabled={votingPostId === post.id}
                                                        className={`text-sm transition ${post.userVote === -1 ? 'text-blue-400' : 'text-gray-400 hover:text-gray-200'} disabled:opacity-50`}
                                                    >
                                                        ▼
                                                    </button>
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
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-6 flex items-center justify-center gap-3">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                                        disabled={!hasPrevious}
                                        className="text-sm px-3 py-1.5 rounded border border-white/20 text-gray-300 hover:bg-white/10 transition disabled:opacity-50"
                                    >
                                        Previous
                                    </button>
                                    <span className="text-sm text-gray-300">
                                        Page {totalPages === 0 ? 0 : currentPage + 1} of {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setCurrentPage(prev => prev + 1)}
                                        disabled={!hasNext}
                                        className="text-sm px-3 py-1.5 rounded border border-white/20 text-gray-300 hover:bg-white/10 transition disabled:opacity-50"
                                    >
                                        Next
                                    </button>
                                </div>
                            </>
                        )}

                        {activeTab === 'resources' && (
                            <div className="space-y-2.5">
                                {resources.map(resource => (
                                    <div key={resource.id} className="bg-[#343434] rounded-xl shadow-sm border border-white/10 px-4 py-3">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-lg font-semibold text-orange-500 truncate">{resource.title}</p>
                                                <p className="text-sm text-gray-300 mt-1">{resource.description}</p>
                                                <div className="text-sm text-gray-300 mt-2 flex items-center gap-2.5 flex-wrap">
                                                    <span className="font-medium text-gray-200">{resource.uploaderUsername}</span>
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
                                                    className={`text-sm transition ${resource.userVote === 1 ? 'text-orange-400' : 'text-gray-400 hover:text-gray-200'} disabled:opacity-50`}
                                                >
                                                    ▲
                                                </button>
                                                <span className="text-sm font-semibold text-gray-200 w-6 text-center">{resource.voteScore ?? 0}</span>
                                                <button
                                                    onClick={(e) => void handleVoteResource(resource.id, -1, e)}
                                                    disabled={votingResourceId === resource.id}
                                                    className={`text-sm transition ${resource.userVote === -1 ? 'text-blue-400' : 'text-gray-400 hover:text-gray-200'} disabled:opacity-50`}
                                                >
                                                    ▼
                                                </button>
                                                <button
                                                    onClick={(e) => handleDownloadResource(resource.id, e)}
                                                    className="text-xs px-3 py-1.5 rounded border border-white/20 text-gray-200 hover:bg-white/10 transition"
                                                >
                                                    Download
                                                </button>
                                                {(user?.username === resource.uploaderUsername || user?.role === 'ADMIN') && (
                                                    <button
                                                        onClick={(e) => void handleDeleteResource(resource, e)}
                                                        disabled={deletingResourceId === resource.id}
                                                        className="text-xs px-3 py-1.5 rounded border border-red-400/40 text-red-300 hover:bg-red-500/10 transition disabled:opacity-50"
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
            </main>

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
                            {similarPosts.length > 0 && (
                                <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg px-4 py-3">
                                    <p className="text-xs font-semibold text-orange-400 mb-2">Similar questions — yours may already be answered:</p>
                                    <ul className="space-y-1">
                                        {similarPosts.map(p => (
                                            <li key={p.id}>
                                                <button
                                                    type="button"
                                                    onClick={() => navigate(`/post/${p.id}`)}
                                                    className="text-sm text-orange-300 hover:text-orange-200 hover:underline text-left"
                                                >
                                                    {p.title}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Body</label>
                                <MarkdownEditor
                                    value={form.body}
                                    onChange={v => setForm(p => ({ ...p, body: v }))}
                                    rows={5}
                                    placeholder="Share details, context, or your thoughts..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Tags</label>
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                    {form.tags.map(tag => (
                                        <span key={tag} className="flex items-center gap-1 px-2 py-0.5 bg-orange-500/20 text-orange-300 rounded-full text-xs">
                                            {tag}
                                            <button type="button" onClick={() => setForm(p => ({ ...p, tags: p.tags.filter(t => t !== tag) }))} className="hover:text-white">×</button>
                                        </span>
                                    ))}
                                </div>
                                <input
                                    type="text"
                                    value={formTagInput}
                                    onChange={e => setFormTagInput(e.target.value)}
                                    onKeyDown={e => {
                                        if ((e.key === 'Enter' || e.key === ',') && formTagInput.trim()) {
                                            e.preventDefault();
                                            const tag = formTagInput.trim().toLowerCase();
                                            if (!form.tags.includes(tag)) setForm(p => ({ ...p, tags: [...p.tags, tag] }));
                                            setFormTagInput('');
                                        }
                                    }}
                                    placeholder="Type a tag and press Enter"
                                    className="w-full bg-[#242424] border border-white/15 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                                />
                                {tagSuggestions.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                        <span className="text-xs text-gray-400 self-center">Suggestions:</span>
                                        {tagSuggestions.map(s => (
                                            <button
                                                key={s} type="button"
                                                onClick={() => {
                                                    if (!form.tags.includes(s)) setForm(p => ({ ...p, tags: [...p.tags, s] }));
                                                    setTagSuggestions(prev => prev.filter(t => t !== s));
                                                }}
                                                className="px-2 py-0.5 bg-white/10 hover:bg-orange-500/30 text-gray-300 hover:text-orange-300 rounded-full text-xs transition"
                                            >+ {s}</button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {error && <p className="text-sm text-red-500">{error}</p>}
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        setError('');
                                        setTagSuggestions([]);
                                        setSimilarPosts([]);
                                    }}
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
                                <MarkdownEditor
                                    value={editForm.body}
                                    onChange={v => setEditForm(p => ({ ...p, body: v }))}
                                    rows={5}
                                    placeholder="Edit your post..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Tags</label>
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                    {editForm.tags.map(tag => (
                                        <span key={tag} className="flex items-center gap-1 px-2 py-0.5 bg-orange-500/20 text-orange-300 rounded-full text-xs">
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
                                            if (!editForm.tags.includes(tag)) setEditForm(p => ({ ...p, tags: [...p.tags, tag] }));
                                            setEditTagInput('');
                                        }
                                    }}
                                    placeholder="Type a tag and press Enter"
                                    className="w-full bg-[#242424] border border-white/15 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                                />
                            </div>
                            {error && <p className="text-sm text-red-500">{error}</p>}
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditingPost(null);
                                        setError('');
                                    }}
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

            {showResourceModal && (
                <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#2d2d2d] text-gray-100 rounded-xl shadow-xl w-full max-w-2xl p-6 border border-white/10">
                        <h3 className="text-lg font-semibold text-gray-100 mb-4">Upload Resource</h3>
                        <form onSubmit={handleUploadResource} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                                <input
                                    type="text"
                                    value={resourceForm.title}
                                    onChange={(e) => setResourceForm((p) => ({ ...p, title: e.target.value }))}
                                    required
                                    className="w-full bg-[#242424] border border-white/15 rounded-lg px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-orange-400"
                                    placeholder="Resource title"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                                <textarea
                                    value={resourceForm.description}
                                    onChange={(e) => setResourceForm((p) => ({ ...p, description: e.target.value }))}
                                    required
                                    rows={4}
                                    className="w-full bg-[#242424] border border-white/15 rounded-lg px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                                    placeholder="What is this file about?"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">File</label>
                                <input
                                    type="file"
                                    required
                                    onChange={(e) => setResourceForm((p) => ({ ...p, file: e.target.files?.[0] ?? null }))}
                                    className="w-full bg-[#242424] border border-white/15 rounded-lg px-4 py-2 text-sm"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowResourceModal(false);
                                        setError('');
                                    }}
                                    className="text-sm px-4 py-2 rounded-lg border border-white/20 text-gray-300 hover:bg-white/10 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={uploadingResource}
                                    className="text-sm px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium transition disabled:opacity-50"
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
