import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NavbarSearch from './NavbarSearch';
import NotificationBell from './NotificationBell';
import ChatIcon from './ChatIcon';

export default function Navbar() {
    const { user, logout, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const isAdmin = user?.role === 'ADMIN';
    const onAdmin = location.pathname === '/admin';
    const onLeaderboard = location.pathname === '/leaderboard';
    const onCalendar = location.pathname === '/calendar';

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="bg-[#323232] shadow-sm sticky top-0 z-50 border-b border-white/10">
            <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
                <button
                    onClick={() => navigate('/')}
                    className="font-bold text-gray-100 hover:text-white text-xl leading-none transition cursor-pointer tracking-tight flex items-center gap-2 shrink-0"
                >
                    <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                    TalkCS
                </button>
                <NavbarSearch />
                <div className="flex items-center gap-1.5 shrink-0">
                    {isAuthenticated ? (
                        <>
                            <button 
                                onClick={() => navigate('/leaderboard')} 
                                className={`text-sm transition px-2 py-1 rounded-lg ${
                                    onLeaderboard ? 'text-white bg-white/10' : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                Leaderboard
                            </button>
                            <button 
                                onClick={() => navigate('/calendar')} 
                                className={`text-sm transition px-2 py-1 rounded-lg ${
                                    onCalendar ? 'text-white bg-white/10' : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                Calendar
                            </button>
                            {isAdmin && (
                                <button 
                                    onClick={() => navigate('/admin')} 
                                    className={`text-sm font-medium px-2 py-1 rounded-lg transition ${
                                        onAdmin ? 'text-orange-400 bg-orange-500/10' : 'text-orange-400/70 hover:text-orange-400 hover:bg-orange-500/5'
                                    }`}
                                >
                                    Admin
                                </button>
                            )}
                            <span className="w-px h-4 bg-white/20 mx-1" />
                            <ChatIcon />
                            <NotificationBell />
                            <span className="w-px h-4 bg-white/20 mx-1" />
                            <button
                                onClick={() => user?.username && navigate(`/profile/${user.username}`)}
                                disabled={!user?.username}
                                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full pl-1.5 pr-3 py-1 transition disabled:opacity-50"
                            >
                                <span className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                                    {user?.username?.charAt(0).toUpperCase() ?? '?'}
                                </span>
                                <span className="text-sm text-gray-200 hidden sm:block max-w-[100px] truncate">{user?.username}</span>
                                {isAdmin && <span className="text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30 px-1.5 py-0.5 rounded-full font-semibold leading-none">ADMIN</span>}
                            </button>
                            <button
                                onClick={handleLogout}
                                title="Log out"
                                className="text-gray-500 hover:text-red-400 transition p-1"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => navigate('/login')}
                            className="text-sm bg-orange-500 hover:bg-orange-600 text-white px-4 py-1.5 rounded-full transition font-medium"
                        >
                            Log In
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
}
