import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getPostById, updatePost, deletePost } from '../api/posts';
import { getComments, createComment, updateComment, deleteComment } from '../api/comments';
import type { Post } from '../api/posts';
import type { CommentResponse } from '../api/comments';

// --- Recursive comment component ---
function CommentItem({
    comment,
    postId,
    currentUsername,
    isAdmin,
    depth = 0,
    onCommentsChanged,
    onEditComment,
    onDeleteComment,
    onAuthorClick,
}: {
    comment: CommentResponse;
    postId: number;
    currentUsername?: string;
    isAdmin: boolean;
    depth?: number;
    onCommentsChanged: () => Promise<void>;
    onEditComment: (commentId: number, body: string) => Promise<void>;
    onDeleteComment: (commentId: number) => Promise<void>;
    onAuthorClick: (username: string) => void;
}) {
    const canEdit = currentUsername === comment.authorUsername;
    const canDelete = canEdit || isAdmin;

    const [replying, setReplying] = useState(false);
    const [editing, setEditing] = useState(false);
    const [replyBody, setReplyBody] = useState('');
    const [editBody, setEditBody] = useState(comment.body);
    const [actionError, setActionError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [editingSubmit, setEditingSubmit] = useState(false);
    const [deleting, setDeleting] = useState(false);

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

    return (
        <div className={`${depth > 0 ? 'ml-6 border-l-2 border-gray-100 pl-4' : ''} mt-4`}>
            <div className="bg-white rounded border border-gray-200 px-4 py-3">
                <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onAuthorClick(comment.authorUsername)}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
                        >
                            {comment.authorUsername}
                        </button>
                        <span className="text-xs text-gray-400">{new Date(comment.createdAt).toLocaleDateString()}</span>
                    </div>
                    {(canEdit || canDelete) && (
                        <div className="flex items-center gap-2">
                            {canEdit && (
                                <button
                                    onClick={() => {
                                        setEditBody(comment.body);
                                        setEditing(v => !v);
                                        setReplying(false);
                                    }}
                                    className="text-xs text-blue-500 hover:text-blue-700 transition"
                                >
                                    {editing ? 'Cancel' : 'Edit'}
                                </button>
                            )}
                            {canDelete && (
                                <button
                                    onClick={() => void handleDelete()}
                                    disabled={deleting}
                                    className="text-xs text-red-500 hover:text-red-700 transition disabled:opacity-50"
                                >
                                    {deleting ? 'Deleting...' : 'Delete'}
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {editing ? (
                    <form onSubmit={handleSaveEdit} className="mt-2 space-y-2">
                        <textarea
                            autoFocus
                            value={editBody}
                            onChange={e => setEditBody(e.target.value)}
                            required
                            rows={2}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                        />
                        <div className="flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setEditing(false)}
                                className="text-xs px-3 py-1.5 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={editingSubmit}
                                className="text-xs px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded transition disabled:opacity-50"
                            >
                                {editingSubmit ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.body}</p>
                        <button
                            onClick={() => {
                                setReplying(r => !r);
                                setEditing(false);
                            }}
                            className="text-xs text-blue-500 hover:text-blue-700 mt-2 transition"
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
                            className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
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
                    onCommentsChanged={onCommentsChanged}
                    onEditComment={onEditComment}
                    onDeleteComment={onDeleteComment}
                    onAuthorClick={onAuthorClick}
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
    const { user, logout } = useAuth();
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
    const [postForm, setPostForm] = useState({ title: '', body: '' });
    const [updatingPost, setUpdatingPost] = useState(false);
    const [deletingPost, setDeletingPost] = useState(false);

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

    const canEditPost = !!post && user?.username === post.authorUsername;
    const canDeletePost = !!post && (canEditPost || isAdmin);

    const openPostEditModal = () => {
        if (!post) return;
        setPostError('');
        setPostForm({ title: post.title, body: post.body });
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

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navbar */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-5xl mx-auto px-4 h-12 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/')}
                            className="font-bold text-gray-800 hover:text-gray-900 text-lg transition cursor-pointer"
                        >
                            TalkCS
                        </button>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600">{user?.email}</span>
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-medium">{user?.role}</span>
                        <button
                            onClick={handleMyProfile}
                            disabled={!user?.username}
                            className="text-sm text-blue-500 hover:text-blue-700 transition disabled:opacity-50"
                        >
                            My Profile
                        </button>
                        <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-800 transition">Log out</button>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 py-8">
                {loading ? (
                    <p className="text-sm text-gray-400">Loading...</p>
                ) : !post ? (
                    <p className="text-sm text-red-500">Post not found.</p>
                ) : (
                    <>
                        {/* Post */}
                        <div className="bg-white border border-gray-200 rounded p-6 mb-6">
                            <div className="flex items-start justify-between gap-4 mb-2">
                                <div>
                                    <h1 className="text-xl font-semibold text-gray-800 mb-1">{post.title}</h1>
                                    <p className="text-xs text-gray-400 mb-2">
                                        by{' '}
                                        <button
                                            onClick={() => navigateToProfile(post.authorUsername)}
                                            className="text-blue-500 hover:text-blue-700 transition"
                                        >
                                            {post.authorUsername}
                                        </button>{' '}
                                        · {new Date(post.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                {canDeletePost && (
                                    <div className="flex items-center gap-2 shrink-0">
                                        {canEditPost && (
                                            <button
                                                onClick={openPostEditModal}
                                                className="text-xs text-blue-500 hover:text-blue-700 transition"
                                            >
                                                Edit
                                            </button>
                                        )}
                                        <button
                                            onClick={() => void handleDeletePost()}
                                            disabled={deletingPost}
                                            className="text-xs text-red-500 hover:text-red-700 transition disabled:opacity-50"
                                        >
                                            {deletingPost ? 'Deleting...' : 'Delete'}
                                        </button>
                                    </div>
                                )}
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{post.body}</p>
                            {postError && <p className="text-xs text-red-500 mt-3">{postError}</p>}
                        </div>

                        {/* Comments */}
                        <div className="mb-4">
                            <h2 className="text-base font-semibold text-gray-800 mb-2">
                                {comments.length} Comment{comments.length !== 1 ? 's' : ''}
                            </h2>
                            {comments.length === 0 ? (
                                <p className="text-sm text-gray-400">No comments yet.</p>
                            ) : (
                                comments.map(c => (
                                    <CommentItem
                                        key={c.id}
                                        comment={c}
                                        postId={postId}
                                        currentUsername={user?.username}
                                        isAdmin={!!isAdmin}
                                        onCommentsChanged={refreshComments}
                                        onEditComment={handleEditComment}
                                        onDeleteComment={handleDeleteComment}
                                        onAuthorClick={navigateToProfile}
                                    />
                                ))
                            )}
                            {commentError && <p className="text-xs text-red-500 mt-3">{commentError}</p>}
                        </div>

                        {/* Comment form */}
                        <div className="bg-white border border-gray-200 rounded p-4 mt-6">
                            <p className="text-xs font-medium text-gray-600 mb-2">Leave a comment</p>
                            <form onSubmit={handleComment} className="flex gap-2">
                                <textarea
                                    value={commentBody}
                                    onChange={e => setCommentBody(e.target.value)}
                                    required
                                    rows={2}
                                    placeholder="Write a comment..."
                                    className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                                />
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="self-end text-sm px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded transition font-medium disabled:opacity-50"
                                >
                                    {submitting ? '...' : 'Comment'}
                                </button>
                            </form>
                        </div>
                    </>
                )}
            </main>

            {/* Edit post modal */}
            {showEditPostModal && (
                <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 mx-4">
                        <h3 className="text-base font-semibold text-gray-800 mb-4">Edit Post</h3>
                        <form onSubmit={handleEditPost} className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={postForm.title}
                                    onChange={e => setPostForm(p => ({ ...p, title: e.target.value }))}
                                    required
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Body</label>
                                <textarea
                                    value={postForm.body}
                                    onChange={e => setPostForm(p => ({ ...p, body: e.target.value }))}
                                    required
                                    rows={5}
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                                />
                            </div>
                            {postError && <p className="text-xs text-red-500">{postError}</p>}
                            <div className="flex justify-end gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={() => { setShowEditPostModal(false); setPostError(''); }}
                                    className="text-sm px-4 py-2 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition"
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
