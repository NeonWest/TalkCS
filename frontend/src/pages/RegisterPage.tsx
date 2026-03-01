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
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                {/* Logo */}
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">TalkCS</h1>
                    <p className="text-gray-500 text-sm mt-1">Join your university forum</p>
                </div>

                {/* Card */}
                <div className="bg-white border border-gray-200 rounded-md p-6 shadow-sm">
                    {success ? (
                        <p className="text-green-600 text-sm text-center py-4">
                            Account created! Redirecting to login...
                        </p>
                    ) : (
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            {/* Username */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                                <input
                                    id="username"
                                    type="text"
                                    placeholder="yourname"
                                    className="w-full border border-gray-300 rounded text-gray-900 text-sm px-3 py-2 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
                                    {...register('username', { required: 'Username is required' })}
                                />
                                {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
                            </div>

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
                                    placeholder="Min. 8 characters"
                                    className="w-full border border-gray-300 rounded text-gray-900 text-sm px-3 py-2 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
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

                <p className="text-gray-500 text-sm text-center mt-4">
                    Already have an account?{' '}
                    <Link to="/login" className="text-blue-600 hover:underline">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
