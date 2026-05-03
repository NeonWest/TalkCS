import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

export default function NavbarSearch() {
    const navigate = useNavigate();
    const location = useLocation();
    const currentQ = new URLSearchParams(location.search).get('q') ?? '';
    const [keyword, setKeyword] = useState(currentQ);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = keyword.trim();
        if (!trimmed) return;
        navigate(`/search?q=${encodeURIComponent(trimmed)}`);
    };

    return (
        <form onSubmit={handleSubmit} className="relative flex items-center w-full group">
            <div className="absolute left-3.5 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none">
                <Search size={16} />
            </div>
            <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Search community..."
                className="w-full bg-secondary/50 border border-border/50 rounded-xl pl-11 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 focus:bg-background transition-all"
            />
        </form>
    );
}
