import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navbar */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-5xl mx-auto px-4 h-12 flex items-center justify-between">
                    <span className="font-bold text-gray-800 text-lg">TalkCS</span>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600">{user?.email}</span>
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-medium">{user?.role}</span>
                        <button
                            id="logout-btn"
                            onClick={handleLogout}
                            className="text-sm text-gray-500 hover:text-gray-800 transition"
                        >
                            Log out
                        </button>
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="max-w-5xl mx-auto px-4 py-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-1">
                    Welcome back, {user?.username}
                </h2>
                <p className="text-gray-500 text-sm">Forum features coming soon.</p>
            </main>
        </div>
    );
}
