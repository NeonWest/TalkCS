import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../api/auth';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await forgotPassword(email);
            setSent(true);
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#1f1f1f] flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-5xl font-bold text-orange-600 tracking-wider inline-flex items-center gap-3">
                        <span className="h-3 w-3 rounded-full bg-orange-500 inline-block" />
                        TalkCS
                    </h1>
                    <p className="text-gray-400 text-sm mt-2">Reset your password</p>
                </div>

                <div className="bg-[#343434] rounded-xl shadow-sm p-8 border border-white/10">
                    {sent ? (
                        <div className="text-center">
                            <p className="text-gray-200 text-sm mb-1">Check your email</p>
                            <p className="text-gray-400 text-sm">If that address is registered, a reset link was sent. It expires in 1 hour.</p>
                            <Link to="/login" className="mt-4 inline-block text-orange-400 hover:text-orange-300 text-sm hover:underline">
                                Back to login
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                    placeholder="you@university.edu"
                                    className="w-full bg-[#242424] border border-white/15 rounded text-gray-100 text-sm px-3 py-2 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
                                />
                            </div>
                            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-medium rounded py-2 transition"
                            >
                                {loading ? 'Sending...' : 'Send reset link'}
                            </button>
                        </form>
                    )}
                </div>

                <p className="text-gray-400 text-sm text-center mt-4">
                    <Link to="/login" className="text-orange-400 hover:text-orange-300 hover:underline">
                        Back to login
                    </Link>
                </p>
            </div>
        </div>
    );
}
