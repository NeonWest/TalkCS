import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

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
        <form onSubmit={handleSubmit} className="hidden md:flex items-center gap-2 flex-1 min-w-0 mx-4">
            <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Search posts, categories, users"
                className="w-full bg-[#242424] border border-white/15 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <button
                type="submit"
                className="text-sm px-3 py-1.5 rounded bg-orange-500 hover:bg-orange-600 text-white transition"
            >
                Search
            </button>
        </form>
    );
}
