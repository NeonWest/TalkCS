import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getPostById, updatePost, deletePost, setPostStatus, acceptAnswer } from '../api/posts';
import { getComments, createComment, updateComment, deleteComment } from '../api/comments';
import { voteOnPost, voteOnComment, getVoteErrorMessage } from '../api/votes';
import type { Post } from '../api/posts';
import type { CommentResponse } from '../api/comments';
import NavbarSearch from '../components/NavbarSearch';
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';
import MarkdownEditor from '../components/MarkdownEditor';

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
}) {
    const canEdit = currentUsername === comment.authorUsername;
    const canDelete = canEdit || isAdmin;
    const isAccepted = acceptedAnswerId === comment.id;

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
        <div className={`mt-3 ${depth > 0 ? 'ml-6 border-l border-white/20 pl-3' : `border-l-4 pl-3 ${isAccepted ? 'border-green-500 bg-green-500/5 rounded-r-lg' : 'border-orange-500'}`}`}>
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
                            className="text-base font-semibold text-gray-100 hover:text-white transition"
                        >
                            {comment.authorUsername}
                        </button>
                        {comment.authorLevel && (
                            <span className="px-1.5 py-0.5 bg-orange-500/15 text-orange-400 rounded text-xs">{comment.authorLevel}</span>
                        )}
                        <span className="text-xs text-gray-400">· {new Date(comment.createdAt).toLocaleDateString()}</span>
                        <div className="ml-2 flex items-center gap-1">
                            <button
                                onClick={() => void handleVote(1)}
                                disabled={voting}
                                className={`text-xs transition ${comment.userVote === 1 ? 'text-orange-400' : 'text-gray-400 hover:text-gray-200'} disabled:opacity-50`}
                            >
                                ▲
                            </button>
                            <span className="text-xs font-semibold text-gray-200 w-5 text-center">{comment.voteScore ?? 0}</span>
                            <button
                                onClick={() => void handleVote(-1)}
                                disabled={voting}
                                className={`text-xs transition ${comment.userVote === -1 ? 'text-blue-400' : 'text-gray-400 hover:text-gray-200'} disabled:opacity-50`}
                            >
                                ▼
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {isPostAuthor && depth === 0 && !isAccepted && (
                            <button
                                onClick={() => void onAcceptAnswer(comment.id)}
                                className="text-sm text-green-400 hover:text-green-300 transition"
                            >
                                ✓ Accept
                            </button>
                        )}
                    {(canEdit || canDelete) && (
                        <>
                            {canEdit && (
                                <button
                                    onClick={() => {
                                        setEditBody(comment.body);
                                        setEditing(v => !v);
                                        setReplying(false);
                                    }}
                                    className="text-sm text-blue-400 hover:text-blue-300 transition"
                                >
                                    {editing ? 'Cancel' : 'Edit'}
                                </button>
                            )}
                            {canDelete && (
                                <button
                                    onClick={() => void handleDelete()}
                                    disabled={deleting}
                                    className="text-sm text-red-400 hover:text-red-300 transition disabled:opacity-50"
                                >
                                    {deleting ? 'Deleting...' : 'Delete'}
                                </button>
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
                                className="text-sm px-3 py-1.5 rounded border border-white/20 text-gray-300 hover:bg-white/10 transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={editingSubmit}
                                className="text-sm px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded transition disabled:opacity-50"
                            >
                                {editingSubmit ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <>
                        <div className="text-sm text-gray-200" data-color-mode="dark">
                        <MDEditor.Markdown source={comment.body} style={{ background: 'transparent', color: 'inherit' }} />
                    </div>
                        <button
                            onClick={() => {
                                setReplying(r => !r);
                                setEditing(false);
                            }}
                            className="text-sm text-blue-400 hover:text-blue-300 mt-2 transition"
                        >
                            {replying ? 'Cancel' : 'Reply'}
                        </button>
                    </>
                )}

                {actionError && <p className="text-xs text-red-500 mt-2">{actionError}</p>}

                {replying && (
                    <form onSubmit={handleReply} className="mt-2 flex gap-2">
                        <input
                            autoFocus
                            type="text"
                            value={replyBody}
                            onChange={e => setReplyBody(e.target.value)}
                            required
                            placeholder="Write a reply..."
                            className="flex-1 bg-[#242424] border border-white/15 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                        />
                        <button
                            type="submit"
                            disabled={submitting}
                            className="text-sm px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded transition disabled:opacity-50"
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
    const { user, logout, isAuthenticated } = useAuth();
    const queryCategoryId = Number(new URLSearchParams(location.search).get('categoryId'));
    const stateCategoryId = (location.state as { categoryId?: number } | null)?.categoryId;
    const categoryId = Number.isFinite(queryCategoryId) && queryCategoryId > 0 ? queryCategoryId : stateCategoryId;
    const isAdmin = user?.role === 'ADMIN';

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

    useEffect(() => {
        Promise.all([
            getPostById(postId).then(setPost),
            getComments(postId).then(setComments),
        ]).finally(() => setLoading(false));
    }, [postId]);

    const handleLogout = () => { logout(); navigate('/login'); };

    const handleMyProfile = () => {
        if (!user?.username) return;
        navigate(`/profile/${user.username}`);
    };

    const navigateToProfile = (username: string) => {
        navigate(`/profile/${username}`);
    };

    const refreshComments = async () => {
        const updated = await getComments(postId);
        setComments(updated);
    };

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
                                <button onClick={handleLogout} className="text-sm text-gray-300 hover:text-white transition">Log out</button>
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
                {loading ? (
                    <p className="text-base text-gray-400">Loading...</p>
                ) : !post ? (
                    <p className="text-base text-red-400">Post not found.</p>
                ) : (
                    <>
                        {/* Post */}
                        <div className="bg-[#343434] border border-white/10 rounded-xl p-5 mb-6 shadow-sm">
                            <div className="flex items-start justify-between gap-4 mb-2">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <h1 className="text-2xl font-semibold text-gray-100 leading-tight">{post.title}</h1>
                                        {post.status && post.status !== 'OPEN' && (
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${post.status === 'SOLVED' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                                                {post.status}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-300 mb-2 flex items-center gap-2.5 flex-wrap">
                                        by{' '}
                                        <button
                                            onClick={() => navigateToProfile(post.authorUsername)}
                                            className="text-gray-200 hover:text-white transition"
                                        >
                                            {post.authorUsername}
                                        </button>
                                        {post.authorLevel && (
                                            <span className="px-1.5 py-0.5 bg-orange-500/15 text-orange-400 rounded text-xs">{post.authorLevel}</span>
                                        )}
                                        <span>•</span>
                                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                                        <span className="px-2 py-0.5 rounded-full bg-black/20 text-gray-200 text-xs">General</span>
                                    </p>
                                </div>
                                <div className="flex items-center gap-4 shrink-0">
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => void handleVotePost(1)}
                                            disabled={votingPost}
                                            className={`text-sm transition ${post.userVote === 1 ? 'text-orange-400' : 'text-gray-400 hover:text-gray-200'} disabled:opacity-50`}
                                        >
                                            ▲
                                        </button>
                                        <span className="text-sm font-semibold text-gray-200 w-6 text-center">{post.voteScore ?? 0}</span>
                                        <button
                                            onClick={() => void handleVotePost(-1)}
                                            disabled={votingPost}
                                            className={`text-sm transition ${post.userVote === -1 ? 'text-blue-400' : 'text-gray-400 hover:text-gray-200'} disabled:opacity-50`}
                                        >
                                            ▼
                                        </button>
                                    </div>
                                    {canDeletePost && (
                                        <div className="flex items-center gap-2">
                                        {canEditPost && (
                                            <button
                                                onClick={openPostEditModal}
                                                className="text-sm text-blue-400 hover:text-blue-300 transition"
                                            >
                                                Edit
                                            </button>
                                        )}
                                        <button
                                            onClick={() => void handleDeletePost()}
                                            disabled={deletingPost}
                                            className="text-sm text-red-400 hover:text-red-300 transition disabled:opacity-50"
                                        >
                                            {deletingPost ? 'Deleting...' : 'Delete'}
                                        </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="border-t border-white/10 pt-3">
                                <div className="text-base leading-relaxed text-gray-200" data-color-mode="dark">
                                    <MDEditor.Markdown source={post.body} style={{ background: 'transparent', color: 'inherit' }} />
                                </div>
                                {post.tags && post.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-4">
                                        {post.tags.map(tag => (
                                            <span key={tag} className="px-2.5 py-0.5 bg-orange-500/15 text-orange-300 rounded-full text-xs">{tag}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {postError && <p className="text-xs text-red-500 mt-3">{postError}</p>}
                        </div>

                        {/* Comments */}
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-gray-300 tracking-wide mb-2">
                                {comments.length} Comment{comments.length !== 1 ? 's' : ''}
                            </h2>
                            {comments.length === 0 ? (
                                <p className="text-base text-gray-400">No comments yet.</p>
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
                                    />
                                ))
                            )}
                            {commentError && <p className="text-xs text-red-500 mt-3">{commentError}</p>}
                        </div>

                        {/* Comment form */}
                        <div className="bg-[#343434] border border-white/10 rounded-xl p-5 mt-8 shadow-sm">
                            <p className="text-sm font-medium text-gray-300 mb-2">Leave a comment</p>
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
                                        className="text-sm px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded transition font-medium disabled:opacity-50"
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
                    <div className="bg-[#2d2d2d] text-gray-100 rounded-xl shadow-xl w-full max-w-lg p-6 mx-4 border border-white/10">
                        <h3 className="text-base font-semibold text-gray-100 mb-4">Edit Post</h3>
                        <form onSubmit={handleEditPost} className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-300 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={postForm.title}
                                    onChange={e => setPostForm(p => ({ ...p, title: e.target.value }))}
                                    required
                                    className="w-full bg-[#242424] border border-white/15 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-300 mb-1">Body</label>
                                <MarkdownEditor
                                    value={postForm.body}
                                    onChange={v => setPostForm(p => ({ ...p, body: v }))}
                                    rows={5}
                                    placeholder="Write your post body..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-300 mb-1">Tags</label>
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                    {postForm.tags.map(tag => (
                                        <span key={tag} className="flex items-center gap-1 px-2 py-0.5 bg-orange-500/20 text-orange-300 rounded-full text-xs">
                                            {tag}
                                            <button type="button" onClick={() => setPostForm(p => ({ ...p, tags: p.tags.filter(t => t !== tag) }))} className="hover:text-white">×</button>
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
                                            if (!postForm.tags.includes(tag)) setPostForm(p => ({ ...p, tags: [...p.tags, tag] }));
                                            setPostTagInput('');
                                        }
                                    }}
                                    placeholder="Type a tag and press Enter"
                                    className="w-full bg-[#242424] border border-white/15 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                                />
                            </div>
                            {postError && <p className="text-xs text-red-500">{postError}</p>}
                            <div className="flex justify-end gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={() => { setShowEditPostModal(false); setPostError(''); }}
                                    className="text-sm px-4 py-2 rounded border border-white/20 text-gray-300 hover:bg-white/10 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={updatingPost}
                                    className="text-sm px-4 py-2 rounded bg-orange-500 hover:bg-orange-600 text-white font-medium transition disabled:opacity-50"
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
