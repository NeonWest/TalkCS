import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { useCommentUpdates } from '../hooks/useCommentUpdates';
import { getPostById, updatePost, deletePost, acceptAnswer, unacceptAnswer, bookmarkPost, unbookmarkPost } from '../api/posts';
import { getComments, createComment, updateComment, deleteComment } from '../api/comments';
import { voteOnPost, voteOnComment, getVoteErrorMessage } from '../api/votes';
import type { Post } from '../api/posts';
import type { CommentResponse } from '../api/comments';
import Navbar from '../components/Navbar';
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';
import MarkdownEditor from '../components/MarkdownEditor';
import { Button } from '../components/ui/button';
import { Bookmark, Pencil, Trash2, Reply, X, CheckCheck } from 'lucide-react';
import { useTheme } from '../context/useTheme';

function linkMentions(text: string): string {
    return text.replace(/@(\w+)/g, '[@$1](/profile/$1)');
}

// --- Recursive comment component ---
function CommentItem({
    comment,
    postId,
    currentUsername,
    isAdmin,
    depth = 0,
    isPostAuthor,
    acceptedAnswerId,
    onCommentsChanged,
    onEditComment,
    onDeleteComment,
    onVoteComment,
    onAuthorClick,
    onAcceptAnswer,
    onUnacceptAnswer,
}: {
    comment: CommentResponse;
    postId: number;
    currentUsername?: string;
    isAdmin: boolean;
    depth?: number;
    isPostAuthor: boolean;
    acceptedAnswerId?: number | null;
    onCommentsChanged: () => Promise<void>;
    onEditComment: (commentId: number, body: string) => Promise<void>;
    onDeleteComment: (commentId: number) => Promise<void>;
    onVoteComment: (commentId: number, value: 1 | -1) => Promise<void>;
    onAuthorClick: (username: string) => void;
    onAcceptAnswer: (commentId: number) => Promise<void>;
    onUnacceptAnswer: () => Promise<void>;
}) {
    const canEdit = currentUsername === comment.authorUsername;
    const canDelete = canEdit || isAdmin;
    const isAccepted = acceptedAnswerId === comment.id;
    const { theme } = useTheme();
    const colorMode = theme === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme;

    const [replying, setReplying] = useState(false);
    const [editing, setEditing] = useState(false);
    const [replyBody, setReplyBody] = useState('');
    const [editBody, setEditBody] = useState(comment.body);
    const [actionError, setActionError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [editingSubmit, setEditingSubmit] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [voting, setVoting] = useState(false);

    const handleReply = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionError('');
        setSubmitting(true);
        try {
            await createComment({ body: replyBody, postId, parentId: comment.id });
            await onCommentsChanged();
            setReplyBody('');
            setReplying(false);
        } catch {
            setActionError('Failed to add reply.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionError('');
        setEditingSubmit(true);
        try {
            await onEditComment(comment.id, editBody);
            setEditing(false);
        } catch {
            setActionError('Failed to update comment.');
        } finally {
            setEditingSubmit(false);
        }
    };

    const handleDelete = async () => {
        const confirmed = window.confirm('Delete this comment? This action cannot be undone.');
        if (!confirmed) return;

        setActionError('');
        setDeleting(true);
        try {
            await onDeleteComment(comment.id);
        } catch {
            setActionError('Failed to delete comment.');
        } finally {
            setDeleting(false);
        }
    };

    const handleVote = async (value: 1 | -1) => {
        setActionError('');
        setVoting(true);
        try {
            await onVoteComment(comment.id, value);
        } catch (error) {
            setActionError(getVoteErrorMessage(error));
        } finally {
            setVoting(false);
        }
    };

    return (
        <div className={`mt-3 ${depth > 0 
            ? `${depth > 3 ? 'ml-2' : 'ml-2 sm:ml-6'} border-l border-border pl-3` 
            : `border-l-4 pl-3 ${isAccepted ? 'border-green-500 bg-green-500/5 rounded-r-lg' : 'border-primary'}`}`}>
            <div className="px-2 py-1">
                {isAccepted && (
                    <div className="flex items-center gap-1.5 text-green-400 text-xs font-semibold mb-1">
                        <span>✓</span><span>Accepted Answer</span>
                    </div>
                )}
                <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onAuthorClick(comment.authorUsername)}
                            className="text-base font-semibold text-foreground hover:text-foreground/70 transition"
                        >
                            {comment.authorUsername}
                        </button>
                        {comment.authorLevel && (
                            <span className="px-1.5 py-0.5 bg-primary/15 text-primary rounded text-xs">{comment.authorLevel}</span>
                        )}
                        <span className="text-xs text-muted-foreground">· {new Date(comment.createdAt).toLocaleDateString()}</span>
                        <div className="ml-2 flex items-center gap-1">
                            <button
                                onClick={() => void handleVote(1)}
                                disabled={voting}
                                className={`text-xs transition ${comment.userVote === 1 ? 'text-primary' : 'text-muted-foreground hover:text-foreground'} disabled:opacity-50`}
                            >
                                ▲
                            </button>
                            <span className="text-xs font-semibold text-foreground w-5 text-center">{comment.voteScore ?? 0}</span>
                            <button
                                onClick={() => void handleVote(-1)}
                                disabled={voting}
                                className={`text-xs transition ${comment.userVote === -1 ? 'text-blue-400' : 'text-muted-foreground hover:text-foreground'} disabled:opacity-50`}
                            >
                                ▼
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center gap-0.5">
                        {isPostAuthor && depth === 0 && (
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => void (isAccepted ? onUnacceptAnswer() : onAcceptAnswer(comment.id))}
                                title={isAccepted ? 'Unaccept answer' : 'Accept as answer'}
                                className={`hover:bg-black/10 dark:hover:bg-accent transition-colors h-7 w-7 ${isAccepted ? 'text-green-500 hover:text-muted-foreground' : 'text-muted-foreground hover:text-green-500'}`}
                            >
                                <CheckCheck size={14} strokeWidth={2} />
                            </Button>
                        )}
                        {(canEdit || canDelete) && (
                            <>
                                {canEdit && (
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => {
                                            setEditBody(comment.body);
                                            setEditing(v => !v);
                                            setReplying(false);
                                        }}
                                        title={editing ? 'Cancel edit' : 'Edit comment'}
                                        className="hover:bg-black/10 dark:hover:bg-accent text-muted-foreground hover:text-foreground transition-colors h-7 w-7"
                                    >
                                        {editing ? <X size={14} strokeWidth={2} /> : <Pencil size={14} strokeWidth={2} />}
                                    </Button>
                                )}
                                {canDelete && (
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => void handleDelete()}
                                        disabled={deleting}
                                        title="Delete comment"
                                        className="hover:bg-black/10 dark:hover:bg-accent text-muted-foreground hover:text-destructive transition-colors h-7 w-7 disabled:opacity-50"
                                    >
                                        <Trash2 size={14} strokeWidth={2} />
                                    </Button>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {editing ? (
                    <form onSubmit={handleSaveEdit} className="mt-2 space-y-2">
                        <MarkdownEditor
                            value={editBody}
                            onChange={setEditBody}
                            rows={3}
                            placeholder="Edit your comment..."
                        />
                        <div className="flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setEditing(false)}
                                className="text-sm px-3 py-1.5 rounded border border-border text-muted-foreground hover:bg-accent/50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={editingSubmit}
                                className="text-sm px-3 py-1.5 bg-primary hover:bg-primary/90 text-white rounded transition disabled:opacity-50"
                            >
                                {editingSubmit ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <>
                        <div className="text-sm text-foreground" data-color-mode={colorMode}>
                        <MDEditor.Markdown source={linkMentions(comment.body)} style={{ background: 'transparent', color: 'inherit' }} />
                    </div>
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => { setReplying(r => !r); setEditing(false); }}
                            title={replying ? 'Cancel reply' : 'Reply'}
                            className="hover:bg-black/10 dark:hover:bg-accent text-muted-foreground hover:text-foreground transition-colors h-7 w-7 mt-1"
                        >
                            {replying ? <X size={14} strokeWidth={2} /> : <Reply size={14} strokeWidth={2} />}
                        </Button>
                    </>
                )}

                {actionError && <p className="text-xs text-destructive mt-2">{actionError}</p>}

                {replying && (
                    <form onSubmit={handleReply} className="mt-2 flex gap-2">
                        <input
                            autoFocus
                            type="text"
                            value={replyBody}
                            onChange={e => setReplyBody(e.target.value)}
                            required
                            placeholder="Write a reply..."
                            className="flex-1 bg-muted border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <button
                            type="submit"
                            disabled={submitting}
                            className="text-sm px-3 py-1.5 bg-primary hover:bg-primary/90 text-white rounded transition disabled:opacity-50"
                        >
                            {submitting ? '...' : 'Reply'}
                        </button>
                    </form>
                )}
            </div>

            {comment.children?.map(child => (
                <CommentItem
                    key={child.id}
                    comment={child}
                    postId={postId}
                    currentUsername={currentUsername}
                    isAdmin={isAdmin}
                    depth={depth + 1}
                    isPostAuthor={isPostAuthor}
                    acceptedAnswerId={acceptedAnswerId}
                    onCommentsChanged={onCommentsChanged}
                    onEditComment={onEditComment}
                    onDeleteComment={onDeleteComment}
                    onVoteComment={onVoteComment}
                    onAuthorClick={onAuthorClick}
                    onAcceptAnswer={onAcceptAnswer}
                    onUnacceptAnswer={onUnacceptAnswer}
                />
            ))}
        </div>
    );
}

// --- PostPage ---
export default function PostPage() {
    const { id } = useParams<{ id: string }>();
    const postId = Number(id);
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isAuthenticated, token } = useAuth();
    const queryCategoryId = Number(new URLSearchParams(location.search).get('categoryId'));
    const stateCategoryId = (location.state as { categoryId?: number } | null)?.categoryId;
    const categoryId = Number.isFinite(queryCategoryId) && queryCategoryId > 0 ? queryCategoryId : stateCategoryId;
    const isAdmin = user?.role === 'ADMIN';
    const { theme } = useTheme();
    const colorMode = theme === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme;

    const [post, setPost] = useState<Post | null>(null);
    const [comments, setComments] = useState<CommentResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [commentBody, setCommentBody] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [postError, setPostError] = useState('');
    const [commentError, setCommentError] = useState('');
    const [showEditPostModal, setShowEditPostModal] = useState(false);
    const [postForm, setPostForm] = useState({ title: '', body: '', tags: [] as string[] });
    const [postTagInput, setPostTagInput] = useState('');
    const [updatingPost, setUpdatingPost] = useState(false);
    const [deletingPost, setDeletingPost] = useState(false);
    const [votingPost, setVotingPost] = useState(false);
    const [bookmarked, setBookmarked] = useState(false);
    const [bookmarking, setBookmarking] = useState(false);

    useEffect(() => {
        Promise.all([
            getPostById(postId).then(p => { setPost(p); setBookmarked(p.bookmarkedByCurrentUser ?? false); }),
            getComments(postId).then(setComments),
        ]).finally(() => setLoading(false));
    }, [postId]);

    const navigateToProfile = (username: string) => {
        navigate(`/profile/${username}`);
    };

    const refreshComments = async () => {
        const updated = await getComments(postId);
        setComments(updated);
    };

    useCommentUpdates(id, token, refreshComments);

    // Add a new top-level comment to the list
    const handleComment = async (e: React.FormEvent) => {
        e.preventDefault();
        setCommentError('');
        setSubmitting(true);
        try {
            await createComment({ body: commentBody, postId });
            await refreshComments();
            setCommentBody('');
        } catch {
            setCommentError('Failed to post comment.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditComment = async (commentId: number, body: string) => {
        await updateComment(commentId, { body, postId });
        await refreshComments();
    };

    const handleDeleteComment = async (commentId: number) => {
        await deleteComment(commentId);
        await refreshComments();
    };

    const handleVoteComment = async (commentId: number, value: 1 | -1) => {
        await voteOnComment(commentId, value);
        await refreshComments();
    };

    const handleAcceptAnswer = async (commentId: number) => {
        if (!post) return;
        const updated = await acceptAnswer(post.id, commentId);
        setPost(updated);
    };

    const handleUnacceptAnswer = async () => {
        if (!post) return;
        const updated = await unacceptAnswer(post.id);
        setPost(updated);
    };

    const canEditPost = !!post && user?.username === post.authorUsername;
    const canDeletePost = !!post && (canEditPost || isAdmin);

    const openPostEditModal = () => {
        if (!post) return;
        setPostError('');
        setPostForm({ title: post.title, body: post.body, tags: post.tags ?? [] });
        setPostTagInput('');
        setShowEditPostModal(true);
    };

    const handleEditPost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!post) return;
        if (!categoryId) {
            setPostError('Missing category context. Open this post from its category page to edit.');
            return;
        }

        setPostError('');
        setUpdatingPost(true);
        try {
            const updated = await updatePost(post.id, {
                title: postForm.title,
                body: postForm.body,
                categoryId,
                tags: postForm.tags,
            });
            setPost(updated);
            setShowEditPostModal(false);
        } catch {
            setPostError('Failed to update post.');
        } finally {
            setUpdatingPost(false);
        }
    };

    const handleDeletePost = async () => {
        if (!post) return;
        const confirmed = window.confirm('Delete this post? This action cannot be undone.');
        if (!confirmed) return;

        setPostError('');
        setDeletingPost(true);
        try {
            await deletePost(post.id);
            if (categoryId) navigate(`/category/${categoryId}`);
            else navigate('/');
        } catch {
            setPostError('Failed to delete post.');
        } finally {
            setDeletingPost(false);
        }
    };

    const handleVotePost = async (value: 1 | -1) => {
        if (!post) return;
        setPostError('');
        setVotingPost(true);
        try {
            await voteOnPost(post.id, value);
            const refreshed = await getPostById(post.id);
            setPost(refreshed);
        } catch (error) {
            setPostError(getVoteErrorMessage(error));
        } finally {
            setVotingPost(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />

            <main className="max-w-4xl mx-auto px-4 py-6">
                {loading ? (
                    <p className="text-base text-muted-foreground">Loading...</p>
                ) : !post ? (
                    <p className="text-base text-destructive">Post not found.</p>
                ) : (
                    <>
                        {/* Post */}
                        <div className="bg-card border border-border rounded-xl p-4 sm:p-5 mb-6 shadow-sm">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                        <h1 className="text-xl sm:text-2xl font-semibold text-foreground leading-tight">{post.title}</h1>
                                        {post.status && post.status !== 'OPEN' && (
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold shrink-0 ${post.status === 'SOLVED' ? 'bg-green-500/20 text-green-400' : 'bg-muted/50 text-muted-foreground'}`}>
                                                {post.status}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2.5 flex-wrap">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-muted-foreground">by</span>
                                            <button
                                                onClick={() => navigateToProfile(post.authorUsername)}
                                                className="text-foreground hover:text-white transition font-medium"
                                            >
                                                {post.authorUsername}
                                            </button>
                                        </div>
                                        {post.authorLevel && (
                                            <span className="px-1.5 py-0.5 bg-primary/15 text-primary rounded text-[10px] sm:text-xs">{post.authorLevel}</span>
                                        )}
                                        <span className="hidden sm:inline text-muted-foreground">•</span>
                                        <span className="text-muted-foreground">{new Date(post.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 sm:gap-4 shrink-0 border-t sm:border-t-0 border-border pt-3 sm:pt-0">
                                    <div className="flex items-center gap-1 bg-muted/60 sm:bg-transparent px-2 py-1 rounded-lg">
                                        <button
                                            onClick={() => void handleVotePost(1)}
                                            disabled={votingPost}
                                            className={`text-sm transition ${post.userVote === 1 ? 'text-primary' : 'text-muted-foreground hover:text-foreground'} disabled:opacity-50`}
                                        >
                                            ▲
                                        </button>
                                        <span className="text-sm font-semibold text-foreground w-6 text-center">{post.voteScore ?? 0}</span>
                                        <button
                                            onClick={() => void handleVotePost(-1)}
                                            disabled={votingPost}
                                            className={`text-sm transition ${post.userVote === -1 ? 'text-blue-400' : 'text-muted-foreground hover:text-foreground'} disabled:opacity-50`}
                                        >
                                            ▼
                                        </button>
                                    </div>
                                    {isAuthenticated && (
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={async () => {
                                                setBookmarking(true);
                                                try {
                                                    if (bookmarked) { await unbookmarkPost(post.id); setBookmarked(false); }
                                                    else { await bookmarkPost(post.id); setBookmarked(true); }
                                                } finally { setBookmarking(false); }
                                            }}
                                            disabled={bookmarking}
                                            title={bookmarked ? 'Remove bookmark' : 'Bookmark'}
                                            className={`hover:bg-black/10 dark:hover:bg-accent hover:text-foreground transition-colors disabled:opacity-50 ${bookmarked ? 'text-primary' : 'text-muted-foreground'}`}
                                        >
                                            <Bookmark size={18} strokeWidth={2} fill={bookmarked ? 'currentColor' : 'none'} />
                                        </Button>
                                    )}
                                    {canDeletePost && (
                                        <div className="flex items-center gap-1 border-l border-border pl-2">
                                            {canEditPost && (
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={openPostEditModal}
                                                    title="Edit post"
                                                    className="hover:bg-black/10 dark:hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                                                >
                                                    <Pencil size={16} strokeWidth={2} />
                                                </Button>
                                            )}
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => void handleDeletePost()}
                                                disabled={deletingPost}
                                                title="Delete post"
                                                className="hover:bg-black/10 dark:hover:bg-accent text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                                            >
                                                <Trash2 size={16} strokeWidth={2} />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="border-t border-border pt-3">
                                <div className="text-base leading-relaxed text-foreground" data-color-mode={colorMode}>
                                    <MDEditor.Markdown source={linkMentions(post.body)} style={{ background: 'transparent', color: 'inherit' }} />
                                </div>
                                {post.tags && post.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-4">
                                        {post.tags.map(tag => (
                                            <span key={tag} className="px-2.5 py-0.5 bg-primary/15 text-primary rounded-full text-xs">{tag}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {postError && <p className="text-xs text-destructive mt-3">{postError}</p>}
                        </div>

                        {/* Comments */}
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-muted-foreground tracking-wide mb-2">
                                {comments.length} Comment{comments.length !== 1 ? 's' : ''}
                            </h2>
                            {comments.length === 0 ? (
                                <p className="text-base text-muted-foreground">No comments yet.</p>
                            ) : (
                                comments.map(c => (
                                    <CommentItem
                                        key={c.id}
                                        comment={c}
                                        postId={postId}
                                        currentUsername={user?.username}
                                        isAdmin={!!isAdmin}
                                        isPostAuthor={user?.username === post.authorUsername}
                                        acceptedAnswerId={post.acceptedAnswerId}
                                        onCommentsChanged={refreshComments}
                                        onEditComment={handleEditComment}
                                        onDeleteComment={handleDeleteComment}
                                        onVoteComment={handleVoteComment}
                                        onAuthorClick={navigateToProfile}
                                        onAcceptAnswer={handleAcceptAnswer}
                                        onUnacceptAnswer={handleUnacceptAnswer}
                                    />
                                ))
                            )}
                            {commentError && <p className="text-xs text-destructive mt-3">{commentError}</p>}
                        </div>

                        {/* Comment form */}
                        <div className="bg-card border border-border rounded-xl p-5 mt-8 shadow-sm">
                            <p className="text-sm font-medium text-muted-foreground mb-2">Leave a comment</p>
                            <form onSubmit={handleComment} className="space-y-2">
                                <MarkdownEditor
                                    value={commentBody}
                                    onChange={setCommentBody}
                                    rows={3}
                                    placeholder="Write a comment..."
                                />
                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="text-sm px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded transition font-medium disabled:opacity-50"
                                    >
                                        {submitting ? '...' : 'Comment'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </>
                )}
            </main>

            {/* Edit post modal */}
            {showEditPostModal && (
                <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
                    <div className="bg-card text-foreground rounded-xl shadow-xl w-full max-lg p-6 mx-4 border border-border">
                        <h3 className="text-base font-semibold text-foreground mb-4">Edit Post</h3>
                        <form onSubmit={handleEditPost} className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1">Title</label>
                                <input
                                    type="text"
                                    value={postForm.title}
                                    onChange={e => setPostForm(p => ({ ...p, title: e.target.value }))}
                                    required
                                    className="w-full bg-muted border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1">Body</label>
                                <MarkdownEditor
                                    value={postForm.body}
                                    onChange={v => setPostForm(p => ({ ...p, body: v }))}
                                    rows={5}
                                    placeholder="Write your post body..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1">Tags</label>
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                    {postForm.tags.map(tag => (
                                        <span key={tag} className="flex items-center gap-1 px-2 py-0.5 bg-primary/20 text-primary rounded-full text-xs">
                                            {tag}
                                            <button type="button" onClick={() => setPostForm(p => ({ ...p, tags: p.tags.filter(t => t !== tag) }))} className="hover:text-foreground/70">×</button>
                                        </span>
                                    ))}
                                </div>
                                <input
                                    type="text"
                                    value={postTagInput}
                                    onChange={e => setPostTagInput(e.target.value)}
                                    onKeyDown={e => {
                                        if ((e.key === 'Enter' || e.key === ',') && postTagInput.trim()) {
                                            e.preventDefault();
                                            const tag = postTagInput.trim().toLowerCase();
                                            if (!postForm.tags.includes(tag)) setPostForm(p => ({ ...p, tags: [...postForm.tags, tag] }));
                                            setPostTagInput('');
                                        }
                                    }}
                                    placeholder="Type a tag and press Enter"
                                    className="w-full bg-muted border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>
                            {postError && <p className="text-xs text-destructive">{postError}</p>}
                            <div className="flex justify-end gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={() => { setShowEditPostModal(false); setPostError(''); }}
                                    className="text-sm px-4 py-2 rounded border border-border text-muted-foreground hover:bg-accent/50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={updatingPost}
                                    className="text-sm px-4 py-2 rounded bg-primary hover:bg-primary/90 text-white font-medium transition disabled:opacity-50"
                                >
                                    {updatingPost ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
