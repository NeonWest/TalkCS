import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NavbarSearch from './NavbarSearch';
import NotificationBell from './NotificationBell';
import ChatIcon from './ChatIcon';
import { ThemeToggle } from './ThemeToggle';

export default function Navbar() {
    const { user, logout, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const isAdmin = user?.role === 'ADMIN';
    const onAdmin = location.pathname === '/admin';
    const onLeaderboard = location.pathname === '/leaderboard';
    const onCalendar = location.pathname === '/calendar';

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="bg-secondary shadow-sm sticky top-0 z-50 border-b border-border">
            <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0 flex-1">
                    <button
                        onClick={() => navigate('/')}
                        className="font-bold text-foreground hover:text-white text-xl leading-none transition cursor-pointer tracking-tight flex items-center gap-2 shrink-0"
                    >
                        <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                        TalkCS
                    </button>
                    <div className="hidden md:block flex-1 max-w-md">
                        <NavbarSearch />
                    </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                    {isAuthenticated ? (
                        <>
                            <div className="hidden md:flex items-center gap-1.5">
                                <button 
                                    onClick={() => navigate('/leaderboard')} 
                                    className={`text-sm transition px-2 py-1 rounded-lg ${
                                        onLeaderboard ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    Leaderboard
                                </button>
                                <button 
                                    onClick={() => navigate('/calendar')} 
                                    className={`text-sm transition px-2 py-1 rounded-lg ${
                                        onCalendar ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    Calendar
                                </button>
                                {isAdmin && (
                                    <button 
                                        onClick={() => navigate('/admin')} 
                                        className={`text-sm font-medium px-2 py-1 rounded-lg transition ${
                                            onAdmin ? 'text-primary bg-primary/10' : 'text-primary/70 hover:text-primary hover:bg-primary/5'
                                        }`}
                                    >
                                        Admin
                                    </button>
                                )}
                                <span className="w-px h-4 bg-border mx-1" />
                            </div>
                            
                            <ChatIcon />
                            <NotificationBell />
                            <ThemeToggle />
                            <span className="w-px h-4 bg-border mx-1 hidden sm:block" />
                            
                            <button
                                onClick={() => user?.username && navigate(`/profile/${user.username}`)}
                                disabled={!user?.username}
                                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-border rounded-full pl-1.5 pr-1.5 sm:pr-3 py-1 transition disabled:opacity-50"
                            >
                                <span className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white shrink-0">
                                    {user?.username?.charAt(0).toUpperCase() ?? '?'}
                                </span>
                                <span className="text-sm text-foreground hidden sm:block max-w-[100px] truncate">{user?.username}</span>
                            </button>

                            <button
                                onClick={() => setIsMenuOpen(true)}
                                className="md:hidden p-1.5 text-muted-foreground hover:text-white transition"
                                aria-label="Open menu"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                                </svg>
                            </button>

                            <button
                                onClick={handleLogout}
                                title="Log out"
                                className="hidden md:block text-muted-foreground hover:text-destructive transition p-1"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </button>
                        </>
                    ) : (
                        <div className="flex items-center gap-2">
                            <ThemeToggle />
                            <button
                                onClick={() => navigate('/login')}
                                className="text-sm bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-1.5 rounded-full transition font-medium"
                            >
                                Log In
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Slide-over Sidebar */}
            {isMenuOpen && (
                <div className="fixed inset-0 z-[100] md:hidden">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                        onClick={() => setIsMenuOpen(false)}
                    />
                    
                    {/* Menu Content */}
                    <div className="absolute right-0 top-0 bottom-0 w-72 bg-card shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
                        <div className="p-4 border-b border-border flex items-center justify-between">
                            <span className="font-bold text-foreground">Menu</span>
                            <button 
                                onClick={() => setIsMenuOpen(false)}
                                className="p-2 text-muted-foreground hover:text-white"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-4 space-y-4 flex-1 overflow-y-auto">
                            <div className="mb-6">
                                <NavbarSearch />
                            </div>

                            <nav className="space-y-1">
                                <button 
                                    onClick={() => { navigate('/leaderboard'); setIsMenuOpen(false); }}
                                    className={`w-full text-left px-4 py-3 rounded-xl transition flex items-center justify-between ${onLeaderboard ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-white/5'}`}
                                >
                                    <span className="font-medium">Leaderboard</span>
                                    <span>🏆</span>
                                </button>
                                <button 
                                    onClick={() => { navigate('/calendar'); setIsMenuOpen(false); }}
                                    className={`w-full text-left px-4 py-3 rounded-xl transition flex items-center justify-between ${onCalendar ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-white/5'}`}
                                >
                                    <span className="font-medium">Calendar</span>
                                    <span>📅</span>
                                </button>
                                {isAdmin && (
                                    <button 
                                        onClick={() => { navigate('/admin'); setIsMenuOpen(false); }}
                                        className={`w-full text-left px-4 py-3 rounded-xl transition flex items-center justify-between ${onAdmin ? 'bg-primary/10 text-primary' : 'text-primary/70 hover:text-primary hover:bg-primary/5'}`}
                                    >
                                        <span className="font-medium">Admin Panel</span>
                                        <span>⚙️</span>
                                    </button>
                                )}
                            </nav>

                            <div className="pt-6 border-t border-border/50">
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left px-4 py-3 rounded-xl text-destructive hover:bg-destructive/5 transition flex items-center justify-between"
                                >
                                    <span className="font-medium">Log out</span>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {user && (
                            <div className="p-4 bg-white/5 border-t border-border">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center font-bold text-white">
                                        {user.username.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-bold text-white truncate">{user.username}</p>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{user.role}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}
