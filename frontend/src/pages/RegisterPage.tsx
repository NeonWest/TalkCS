import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { register as registerApi } from '../api/auth';
import { useAuth } from '../context/AuthContext';

interface RegisterFormData {
    username: string;
    email: string;
    password: string;
}

export default function RegisterPage() {
    const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { isAuthenticated, login } = useAuth();
    const navigate = useNavigate();

    if (isAuthenticated) return <Navigate to="/" replace />;

    const onSubmit = async (data: RegisterFormData) => {
        setError('');
        setLoading(true);
        try {
            const response = await registerApi(data);
            login(response.data);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-block mb-3">
                        <h1 className="text-5xl font-bold text-primary tracking-wider inline-flex items-center gap-3">
                            <span className="h-3 w-3 rounded-full bg-primary inline-block" />
                            TalkCS
                        </h1>
                    </div>
                    <p className="text-foreground text-base font-medium">Your University Forum</p>
                    <p className="text-muted-foreground text-sm mt-2">Join the conversation</p>
                </div>

                {/* Card */}
                <div className="bg-card rounded-xl shadow-sm p-8 border border-border">
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            {/* Username */}
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Username</label>
                                <input
                                    id="username"
                                    type="text"
                                    placeholder="yourname"
                                    className="w-full bg-muted border border-border rounded text-foreground text-sm px-3 py-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                    {...register('username', { required: 'Username is required' })}
                                />
                                {errors.username && <p className="text-destructive text-xs mt-1">{errors.username.message}</p>}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Email</label>
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="you@university.edu"
                                    className="w-full bg-muted border border-border rounded text-foreground text-sm px-3 py-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                    {...register('email', {
                                        required: 'Email is required',
                                        pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' }
                                    })}
                                />
                                {errors.email && <p className="text-destructive text-xs mt-1">{errors.email.message}</p>}
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Password</label>
                                <input
                                    id="password"
                                    type="password"
                                    placeholder="Min. 8 characters"
                                    className="w-full bg-muted border border-border rounded text-foreground text-sm px-3 py-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                    {...register('password', {
                                        required: 'Password is required',
                                        minLength: { value: 8, message: 'Minimum 8 characters' }
                                    })}
                                />
                                {errors.password && <p className="text-destructive text-xs mt-1">{errors.password.message}</p>}
                            </div>

                            {/* Error */}
                            {error && (
                                <p className="text-destructive text-sm text-center">{error}</p>
                            )}

                            {/* Submit */}
                            <button
                                id="register-btn"
                                type="submit"
                                disabled={loading}
                                className="w-full bg-primary hover:bg-primary/90 disabled:opacity-60 text-white text-sm font-medium rounded py-2 transition"
                            >
                                {loading ? 'Creating account...' : 'Create account'}
                            </button>
                        </form>
                </div>

                <p className="text-muted-foreground text-sm text-center mt-4">
                    Already have an account?{' '}
                    <Link to="/login" className="text-primary hover:text-primary/80 hover:underline">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
