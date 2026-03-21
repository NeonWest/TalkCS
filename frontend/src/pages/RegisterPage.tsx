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
    const [success, setSuccess] = useState(false);
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    if (isAuthenticated) return <Navigate to="/" replace />;

    const onSubmit = async (data: RegisterFormData) => {
        setError('');
        setLoading(true);
        try {
            await registerApi(data);
            setSuccess(true);
            setTimeout(() => navigate('/login'), 1500);
        } catch (err: any) {
            setError(err.response?.data || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#1f1f1f] flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-block mb-3">
                        <h1 className="text-5xl font-bold text-orange-600 tracking-wider inline-flex items-center gap-3">
                            <span className="h-3 w-3 rounded-full bg-orange-500 inline-block" />
                            TalkCS
                        </h1>
                    </div>
                    <p className="text-gray-200 text-base font-medium">Your University Forum</p>
                    <p className="text-gray-400 text-sm mt-2">Join the conversation</p>
                </div>

                {/* Card */}
                <div className="bg-[#343434] rounded-xl shadow-sm p-8 border border-white/10">
                    {success ? (
                        <p className="text-green-600 text-sm text-center py-4">
                            Account created! Redirecting to login...
                        </p>
                    ) : (
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            {/* Username */}
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-1">Username</label>
                                <input
                                    id="username"
                                    type="text"
                                    placeholder="yourname"
                                    className="w-full bg-[#242424] border border-white/15 rounded text-gray-100 text-sm px-3 py-2 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
                                    {...register('username', { required: 'Username is required' })}
                                />
                                {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-1">Email</label>
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="you@university.edu"
                                    className="w-full bg-[#242424] border border-white/15 rounded text-gray-100 text-sm px-3 py-2 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
                                    {...register('email', {
                                        required: 'Email is required',
                                        pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' }
                                    })}
                                />
                                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-1">Password</label>
                                <input
                                    id="password"
                                    type="password"
                                    placeholder="Min. 8 characters"
                                    className="w-full bg-[#242424] border border-white/15 rounded text-gray-100 text-sm px-3 py-2 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
                                    {...register('password', {
                                        required: 'Password is required',
                                        minLength: { value: 8, message: 'Minimum 8 characters' }
                                    })}
                                />
                                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                            </div>

                            {/* Error */}
                            {error && (
                                <p className="text-red-500 text-sm text-center">{error}</p>
                            )}

                            {/* Submit */}
                            <button
                                id="register-btn"
                                type="submit"
                                disabled={loading}
                                className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-medium rounded py-2 transition"
                            >
                                {loading ? 'Creating account...' : 'Create account'}
                            </button>
                        </form>
                    )}
                </div>

                <p className="text-gray-400 text-sm text-center mt-4">
                    Already have an account?{' '}
                    <Link to="/login" className="text-orange-400 hover:text-orange-300 hover:underline">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
