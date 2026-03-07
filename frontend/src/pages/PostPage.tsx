import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getPostById } from '../api/posts';
import { getComments, createComment } from '../api/comments';
import type { Post } from '../api/posts';
import type { CommentResponse } from '../api/comments';

// --- Recursive comment component ---
function CommentItem({
    comment,
    postId,
    depth = 0,
    onNewComment,
}: {
    comment: CommentResponse;
    postId: number;
    depth?: number;
    onNewComment: (c: CommentResponse, parentId: number) => void;
}) {
    const [replying, setReplying] = useState(false);
    const [replyBody, setReplyBody] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleReply = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const created = await createComment({ body: replyBody, postId, parentId: comment.id });
            onNewComment(created, comment.id);
            setReplyBody('');
            setReplying(false);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={`${depth > 0 ? 'ml-6 border-l-2 border-gray-100 pl-4' : ''} mt-4`}>
            <div className="bg-white rounded border border-gray-200 px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-gray-700">{comment.authorUsername}</span>
                    <span className="text-xs text-gray-400">{new Date(comment.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.body}</p>
                <button
                    onClick={() => setReplying(r => !r)}
                    className="text-xs text-blue-500 hover:text-blue-700 mt-2 transition"
                >
                    {replying ? 'Cancel' : 'Reply'}
                </button>

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
                    depth={depth + 1}
                    onNewComment={onNewComment}
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
    const { user, logout } = useAuth();

    const [post, setPost] = useState<Post | null>(null);
    const [comments, setComments] = useState<CommentResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [commentBody, setCommentBody] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        Promise.all([
            getPostById(postId).then(setPost),
            getComments(postId).then(setComments),
        ]).finally(() => setLoading(false));
    }, [postId]);

    const handleLogout = () => { logout(); navigate('/login'); };

    // Add a new top-level comment to the list
    const handleComment = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const created = await createComment({ body: commentBody, postId });
            setComments(prev => [...prev, created]);
            setCommentBody('');
        } finally {
            setSubmitting(false);
        }
    };

    // Recursively insert a reply into the right parent
    const insertReply = (list: CommentResponse[], parentId: number, newComment: CommentResponse): CommentResponse[] => {
        return list.map(c => {
            if (c.id === parentId) return { ...c, children: [...(c.children || []), newComment] };
            return { ...c, children: insertReply(c.children || [], parentId, newComment) };
        });
    };

    const handleNewComment = (newComment: CommentResponse, parentId: number) => {
        setComments(prev => insertReply(prev, parentId, newComment));
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navbar */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-5xl mx-auto px-4 h-12 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate(-1)}
                            className="text-sm text-gray-500 hover:text-gray-800 transition"
                        >
                            ← Back
                        </button>
                        <span className="font-bold text-gray-800 text-lg">TalkCS</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600">{user?.email}</span>
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-medium">{user?.role}</span>
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
                            <h1 className="text-xl font-semibold text-gray-800 mb-1">{post.title}</h1>
                            <p className="text-xs text-gray-400 mb-4">
                                by {post.authorUsername} · {new Date(post.createdAt).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{post.body}</p>
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
                                        onNewComment={handleNewComment}
                                    />
                                ))
                            )}
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
        </div>
    );
}
