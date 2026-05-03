import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { useUI } from '../context/useUI';
import NavbarSearch from './NavbarSearch';
import NotificationBell from './NotificationBell';
import ChatIcon from './ChatIcon';
import { ThemeToggle } from './ThemeToggle';
import { 
    Menu, 
    X, 
    LogOut, 
    Trophy, 
    Calendar as CalendarIcon, 
    ShieldCheck,
    Cpu,
    Plus,
    Zap,
    ChevronRight
} from 'lucide-react';

export default function Navbar() {
    const { user, logout, isAuthenticated } = useAuth();
    const { openPostComposer } = useUI();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const isAdmin = user?.role === 'ADMIN' || user?.role === 'PROFESSOR';
    const onAdmin = location.pathname === '/admin';
    const onLeaderboard = location.pathname === '/leaderboard';
    const onCalendar = location.pathname === '/calendar';

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${
            scrolled ? 'bg-background/80 backdrop-blur-xl border-b border-border shadow-lg shadow-black/5 py-2' : 'bg-transparent py-4'
        }`}>
            <div className="max-w-7xl mx-auto px-4 flex items-center justify-between gap-8">
                {/* Logo Section */}
                <div className="flex items-center gap-8 min-w-0 flex-1">
                    <Link
                        to="/"
                        className="group flex items-center gap-2.5 shrink-0"
                    >
                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                            <Cpu size={22} strokeWidth={2.5} />
                        </div>
                        <span className="text-xl font-black tracking-tighter text-foreground group-hover:text-primary transition-colors">
                            TalkCS
                        </span>
                    </Link>

                    {/* Search Bar */}
                    <div className="hidden lg:block flex-1 max-w-xl">
                        <NavbarSearch />
                    </div>
                </div>

                {/* Desktop Navigation */}
                <div className="flex items-center gap-2 shrink-0">
                    {isAuthenticated ? (
                        <>
                            <nav className="hidden xl:flex items-center gap-1 mr-4">
                                <Link 
                                    to="/leaderboard" 
                                    className={`flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl transition-all ${
                                        onLeaderboard ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                                    }`}
                                >
                                    <Trophy size={16} />
                                    Leaderboard
                                </Link>
                                <Link 
                                    to="/calendar" 
                                    className={`flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl transition-all ${
                                        onCalendar ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                                    }`}
                                >
                                    <CalendarIcon size={16} />
                                    Events
                                </Link>
                                {isAdmin && (
                                    <Link 
                                        to="/admin" 
                                        className={`flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl transition-all ${
                                            onAdmin ? 'text-primary bg-primary/10' : 'text-primary/70 hover:text-primary hover:bg-primary/5'
                                        }`}
                                    >
                                        <ShieldCheck size={16} />
                                        Admin
                                    </Link>
                                )}
                            </nav>
                            
                            <div className="flex items-center gap-1.5 px-1.5 py-1 rounded-2xl bg-accent/30 border border-border/40 backdrop-blur-sm">
                                <button
                                    onClick={() => openPostComposer()}
                                    className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-all"
                                    title="Create Post"
                                >
                                    <Plus size={20} strokeWidth={3} />
                                </button>
                                <ChatIcon />
                                <NotificationBell />
                                <ThemeToggle />
                            </div>

                            <span className="w-px h-6 bg-border mx-2 hidden sm:block" />
                            
                            <button
                                onClick={() => user?.username && navigate(`/profile/${user.username}`)}
                                className="group flex items-center gap-3 pl-1 pr-1.5 sm:pr-4 py-1 rounded-2xl hover:bg-accent/50 transition-all active:scale-95 border border-transparent hover:border-border"
                            >
                                <div className="w-9 h-9 rounded-[0.8rem] bg-primary flex items-center justify-center text-sm font-black text-primary-foreground shadow-lg shadow-primary/20 group-hover:rotate-6 transition-transform">
                                    {user?.username?.charAt(0).toUpperCase()}
                                </div>
                                <div className="hidden sm:flex flex-col items-start leading-none">
                                    <span className="text-sm font-bold text-foreground truncate max-w-[100px]">{user?.username}</span>
                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-0.5">{user?.role}</span>
                                </div>
                            </button>

                            <button
                                onClick={() => setIsMenuOpen(true)}
                                className="xl:hidden p-2.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl transition"
                                aria-label="Open menu"
                            >
                                <Menu size={24} />
                            </button>

                            <button
                                onClick={handleLogout}
                                title="Log out"
                                className="hidden xl:flex p-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition"
                            >
                                <LogOut size={20} />
                            </button>
                        </>
                    ) : (
                        <div className="flex items-center gap-4">
                            <ThemeToggle />
                            <Link
                                to="/login"
                                className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-2xl text-sm font-bold shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                            >
                                Get Started
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Navigation Drawer */}
            {isMenuOpen && (
                <div className="fixed inset-0 z-[200] xl:hidden">
                    <div 
                        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
                        onClick={() => setIsMenuOpen(false)}
                    />
                    
                    <div className="absolute right-0 top-0 bottom-0 w-80 bg-card border-l border-border shadow-2xl animate-in slide-in-from-right duration-500 flex flex-col">
                        <div className="p-6 border-b border-border flex items-center justify-between bg-accent/20">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-black shadow-lg shadow-primary/20">
                                    <Cpu size={16} />
                                </div>
                                <span className="font-black tracking-tight text-foreground uppercase text-xs">Navigation Menu</span>
                            </div>
                            <button 
                                onClick={() => setIsMenuOpen(false)}
                                className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6 flex-1 overflow-y-auto no-scrollbar">
                            <div className="lg:hidden">
                                <NavbarSearch />
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-4">Main Menu</h3>
                                <nav className="space-y-1">
                                    <Link 
                                        to="/" 
                                        onClick={() => setIsMenuOpen(false)}
                                        className="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-muted-foreground hover:bg-secondary hover:text-foreground transition-all group font-bold"
                                    >
                                        <Zap size={18} className="group-hover:text-primary transition-colors" />
                                        <span>Global Feed</span>
                                    </Link>
                                    <Link 
                                        to="/leaderboard" 
                                        onClick={() => setIsMenuOpen(false)}
                                        className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all font-bold ${onLeaderboard ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
                                    >
                                        <Trophy size={18} />
                                        <span>Leaderboard</span>
                                    </Link>
                                    <Link 
                                        to="/calendar" 
                                        onClick={() => setIsMenuOpen(false)}
                                        className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all font-bold ${onCalendar ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
                                    >
                                        <CalendarIcon size={18} />
                                        <span>Calendar</span>
                                    </Link>
                                    {isAdmin && (
                                        <Link 
                                            to="/admin" 
                                            onClick={() => setIsMenuOpen(false)}
                                            className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all font-bold ${onAdmin ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
                                        >
                                            <ShieldCheck size={18} />
                                            <span>Admin Panel</span>
                                        </Link>
                                    )}
                                </nav>
                            </div>

                            <div className="pt-6 border-t border-border">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center justify-between px-4 py-4 rounded-2xl text-destructive font-black hover:bg-destructive/10 transition-all uppercase text-[10px] tracking-widest"
                                >
                                    Log out Account
                                    <LogOut size={16} />
                                </button>
                            </div>
                        </div>

                        {user && (
                            <div className="p-6 bg-accent/20 border-t border-border mt-auto">
                                <Link 
                                    to={`/profile/${user.username}`}
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex items-center gap-4 group"
                                >
                                    <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center font-black text-white shadow-xl shadow-primary/20 group-hover:scale-110 transition-transform">
                                        {user.username.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-base font-black text-foreground truncate group-hover:text-primary transition-colors">{user.username}</p>
                                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{user.role}</p>
                                    </div>
                                    <ChevronRight size={18} className="text-muted-foreground" />
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}
