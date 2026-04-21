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
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-5xl font-bold text-primary tracking-wider inline-flex items-center gap-3">
                        <span className="h-3 w-3 rounded-full bg-primary inline-block" />
                        TalkCS
                    </h1>
                    <p className="text-muted-foreground text-sm mt-2">Reset your password</p>
                </div>

                <div className="bg-card rounded-xl shadow-sm p-8 border border-border">
                    {sent ? (
                        <div className="text-center">
                            <p className="text-foreground text-sm mb-1">Check your email</p>
                            <p className="text-muted-foreground text-sm">If that address is registered, a reset link was sent. It expires in 1 hour.</p>
                            <Link to="/login" className="mt-4 inline-block text-primary hover:text-primary/80 text-sm hover:underline">
                                Back to login
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                    placeholder="you@university.edu"
                                    className="w-full bg-muted border border-border rounded text-foreground text-sm px-3 py-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                />
                            </div>
                            {error && <p className="text-destructive text-sm text-center">{error}</p>}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-primary hover:bg-primary/90 disabled:opacity-60 text-white text-sm font-medium rounded py-2 transition"
                            >
                                {loading ? 'Sending...' : 'Send reset link'}
                            </button>
                        </form>
                    )}
                </div>

                <p className="text-muted-foreground text-sm text-center mt-4">
                    <Link to="/login" className="text-primary hover:text-primary/80 hover:underline">
                        Back to login
                    </Link>
                </p>
            </div>
        </div>
    );
}
