import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { login as loginApi } from '../api/auth';
import { useAuth } from '../context/AuthContext';

interface LoginFormData {
    email: string;
    password: string;
}

export default function LoginPage() {
    const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    if (isAuthenticated) return <Navigate to="/" replace />;

    const onSubmit = async (data: LoginFormData) => {
        setError('');
        setLoading(true);
        try {
            const response = await loginApi(data);
            login(response);
            navigate('/');
        } catch {
            setError('Invalid email or password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                {/* Logo */}
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">TalkCS</h1>
                    <p className="text-gray-500 text-sm mt-1">Your university forum</p>
                </div>

                {/* Card */}
                <div className="bg-white border border-gray-200 rounded-md p-6 shadow-sm">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                id="email"
                                type="email"
                                placeholder="you@university.edu"
                                className="w-full border border-gray-300 rounded text-gray-900 text-sm px-3 py-2 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
                                {...register('email', {
                                    required: 'Email is required',
                                    pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' }
                                })}
                            />
                            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                className="w-full border border-gray-300 rounded text-gray-900 text-sm px-3 py-2 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
                                {...register('password', { required: 'Password is required' })}
                            />
                            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                        </div>

                        {/* Error */}
                        {error && (
                            <p className="text-red-500 text-sm text-center">{error}</p>
                        )}

                        {/* Submit */}
                        <button
                            id="login-btn"
                            type="submit"
                            disabled={loading}
                            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-medium rounded py-2 transition"
                        >
                            {loading ? 'Signing in...' : 'Sign in'}
                        </button>
                    </form>
                </div>

                <p className="text-gray-500 text-sm text-center mt-4">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-blue-600 hover:underline">
                        Register
                    </Link>
                </p>
            </div>
        </div>
    );
}
