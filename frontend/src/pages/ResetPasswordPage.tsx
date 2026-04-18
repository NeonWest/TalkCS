import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../api/auth';

export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') ?? '';
    const navigate = useNavigate();

    const [newPassword, setNewPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [done, setDone] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (newPassword !== confirm) { setError('Passwords do not match.'); return; }
        if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
        setLoading(true);
        try {
            await resetPassword(token, newPassword);
            setDone(true);
            setTimeout(() => navigate('/login'), 2500);
        } catch {
            setError('Invalid or expired reset link. Please request a new one.');
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen bg-[#1f1f1f] flex items-center justify-center p-4">
                <div className="text-center">
                    <p className="text-gray-400 text-sm mb-3">Invalid reset link.</p>
                    <Link to="/forgot-password" className="text-orange-400 hover:text-orange-300 text-sm hover:underline">Request a new one</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#1f1f1f] flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-5xl font-bold text-orange-600 tracking-wider inline-flex items-center gap-3">
                        <span className="h-3 w-3 rounded-full bg-orange-500 inline-block" />
                        TalkCS
                    </h1>
                    <p className="text-gray-400 text-sm mt-2">Set a new password</p>
                </div>

                <div className="bg-[#343434] rounded-xl shadow-sm p-8 border border-white/10">
                    {done ? (
                        <div className="text-center">
                            <p className="text-gray-200 text-sm mb-1">Password updated!</p>
                            <p className="text-gray-400 text-sm">Redirecting to login...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-1">New Password</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    required
                                    placeholder="••••••••"
                                    className="w-full bg-[#242424] border border-white/15 rounded text-gray-100 text-sm px-3 py-2 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-1">Confirm Password</label>
                                <input
                                    type="password"
                                    value={confirm}
                                    onChange={e => setConfirm(e.target.value)}
                                    required
                                    placeholder="••••••••"
                                    className="w-full bg-[#242424] border border-white/15 rounded text-gray-100 text-sm px-3 py-2 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
                                />
                            </div>
                            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-medium rounded py-2 transition"
                            >
                                {loading ? 'Saving...' : 'Reset password'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
