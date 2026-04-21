import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { search } from '../api/search';
import type { SearchResponse } from '../api/search';
import Navbar from '../components/Navbar';

export default function SearchPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const query = new URLSearchParams(location.search).get('q') ?? '';

    const [results, setResults] = useState<SearchResponse>({ posts: [], categories: [], users: [] });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const trimmed = query.trim();
        if (!trimmed) {
            setResults({ posts: [], categories: [], users: [] });
            return;
        }

        setError('');
        setLoading(true);
        search(trimmed)
            .then(setResults)
            .catch(() => setError('Failed to load search results.'))
            .finally(() => setLoading(false));
    }, [query]);

    const totalResults = results.posts.length + results.categories.length + results.users.length;

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />

            <main className="max-w-5xl mx-auto px-4 py-6 space-y-8">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Search</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {query.trim() ? `Found ${totalResults} results for "${query}"` : 'Enter a keyword in the search bar above.'}
                    </p>
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}
                {loading && <p className="text-sm text-muted-foreground">Searching...</p>}
                {!loading && query.trim() && totalResults === 0 && (
                    <div className="bg-background rounded-xl shadow-sm p-8 text-center text-muted-foreground border border-border">
                        No results found.
                    </div>
                )}

                {!loading && query.trim() && totalResults > 0 && (
                    <>
                        <section className="space-y-3">
                            <h2 className="text-lg font-semibold text-primary">Posts</h2>
                            {results.posts.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No matching posts.</p>
                            ) : (
                                <div className="space-y-2">
                                    {results.posts.map((post) => (
                                        <button
                                            key={post.id}
                                            onClick={() => navigate(`/post/${post.id}`)}
                                            className="w-full text-left bg-card rounded-xl border border-border p-3 hover:bg-accent transition"
                                        >
                                            <p className="text-base font-semibold text-foreground">{post.title}</p>
                                            <p className="text-xs text-muted-foreground mt-1">by {post.authorUsername}</p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-lg font-semibold text-primary">Categories</h2>
                            {results.categories.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No matching categories.</p>
                            ) : (
                                <div className="space-y-2">
                                    {results.categories.map((category) => (
                                        <button
                                            key={category.id}
                                            onClick={() => navigate(`/category/${category.id}`)}
                                            className="w-full text-left bg-card rounded-xl border border-border p-3 hover:bg-accent transition"
                                        >
                                            <p className="text-base font-semibold text-foreground">{category.name}</p>
                                            <p className="text-xs text-muted-foreground mt-1">{category.description}</p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-lg font-semibold text-primary">Users</h2>
                            {results.users.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No matching users.</p>
                            ) : (
                                <div className="space-y-2">
                                    {results.users.map((profile) => (
                                        <button
                                            key={profile.id}
                                            onClick={() => navigate(`/profile/${profile.username}`)}
                                            className="w-full text-left bg-card rounded-xl border border-border p-3 hover:bg-accent transition"
                                        >
                                            <p className="text-base font-semibold text-foreground">{profile.username}</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {profile.postCount} post{profile.postCount !== 1 ? 's' : ''} • Reputation {profile.reputation ?? 0}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </section>
                    </>
                )}
            </main>
        </div>
    );
}
