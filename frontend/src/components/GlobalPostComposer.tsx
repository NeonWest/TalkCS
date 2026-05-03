import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getCategories } from '../api/categories';
import { createPost, getSimilarPosts } from '../api/posts';
import type { SimilarPost } from '../api/posts';
import MarkdownEditor from './MarkdownEditor';
import { suggestTags } from '../api/tags';
import { X, ChevronDown, Search, Sparkles, AlertCircle, Send, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface GlobalPostComposerProps {
    isOpen: boolean;
    onClose: () => void;
    initialCategoryId?: number;
}

export default function GlobalPostComposer({ isOpen, onClose, initialCategoryId }: GlobalPostComposerProps) {
    const queryClient = useQueryClient();
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(initialCategoryId ?? null);
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
    const [categorySearch, setCategorySearch] = useState('');
    
    const [form, setForm] = useState({ title: '', body: '', tags: [] as string[] });
    const [formTagInput, setFormTagInput] = useState('');
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState('');
    const [similarPosts, setSimilarPosts] = useState<SimilarPost[]>([]);
    const similarTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const { data: categories = [] } = useQuery({
        queryKey: ['categories'],
        queryFn: getCategories,
        enabled: isOpen
    });

    useEffect(() => {
        if (initialCategoryId) setSelectedCategoryId(initialCategoryId);
    }, [initialCategoryId]);

    // Live search for similar posts
    useEffect(() => {
        if (!isOpen || !selectedCategoryId) return;
        if (similarTimer.current) clearTimeout(similarTimer.current);
        similarTimer.current = setTimeout(async () => {
            if (!form.title.trim()) { setSimilarPosts([]); return; }
            try {
                const results = await getSimilarPosts(form.title, form.body, selectedCategoryId, form.tags);
                setSimilarPosts(results);
            } catch { /* ignore */ }
        }, 500);
        return () => { if (similarTimer.current) clearTimeout(similarTimer.current); };
    }, [form.title, form.body, form.tags, isOpen, selectedCategoryId]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCategoryId) {
            setError('Please select a category first.');
            return;
        }
        setError('');
        setCreating(true);
        try {
            await createPost({ ...form, categoryId: selectedCategoryId });
            toast.success('Post created successfully!');
            queryClient.invalidateQueries({ queryKey: ['globalPosts'] });
            queryClient.invalidateQueries({ queryKey: ['posts', selectedCategoryId] });
            onClose();
            setForm({ title: '', body: '', tags: [] });
            setSelectedCategoryId(initialCategoryId ?? null);
        } catch {
            setError('Failed to create post. Please try again.');
        } finally {
            setCreating(false);
        }
    };

    const handleAddTag = async () => {
        const tag = formTagInput.trim().toLowerCase();
        if (tag && !form.tags.includes(tag)) {
            setForm(prev => ({ ...form, tags: [...prev.tags, tag] }));
            setFormTagInput('');
        }
    };

    const removeTag = (tag: string) => {
        setForm(prev => ({ ...form, tags: prev.tags.filter(t => t !== tag) }));
    };

    const autoSuggestTags = async () => {
        if (!form.title) return;
        try {
            const suggestions = await suggestTags(form.title, form.body);
            const unique = Array.from(new Set([...form.tags, ...suggestions])).slice(0, 5);
            setForm(prev => ({ ...prev, tags: unique }));
            toast.info("Tags suggested based on your content");
        } catch { /* ignore */ }
    };

    if (!isOpen) return null;

    const filteredCategories = categories.filter(c => 
        c.name.toLowerCase().includes(categorySearch.toLowerCase())
    );

    const selectedCategory = categories.find(c => c.id === selectedCategoryId);

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />
            
            <div className="relative w-full max-w-4xl bg-card border border-border shadow-2xl rounded-[2.5rem] overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="px-8 py-6 border-b border-border flex items-center justify-between bg-accent/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                            <Plus size={24} strokeWidth={3} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-foreground">Create a Discussion</h2>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Share your thoughts with the community</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2.5 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-all">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar">
                    <form onSubmit={handleCreate} className="p-8 space-y-8">
                        {/* Category Selector */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Post to Community</label>
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                                    className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl border transition-all text-left group
                                        ${isCategoryDropdownOpen ? 'border-primary ring-4 ring-primary/10 bg-background' : 'border-border bg-secondary/30 hover:border-primary/50 hover:bg-secondary/50'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs transition-colors
                                            ${selectedCategory ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                            {selectedCategory ? selectedCategory.name.charAt(0).toUpperCase() : '?'}
                                        </div>
                                        <span className={`font-bold ${selectedCategory ? 'text-foreground' : 'text-muted-foreground'}`}>
                                            {selectedCategory ? selectedCategory.name : 'Choose a category...'}
                                        </span>
                                    </div>
                                    <ChevronDown size={18} className={`text-muted-foreground transition-transform duration-300 ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isCategoryDropdownOpen && (
                                    <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-popover border border-border shadow-2xl rounded-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="p-3 border-b border-border bg-accent/10">
                                            <div className="relative">
                                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                                <input
                                                    autoFocus
                                                    placeholder="Search categories..."
                                                    value={categorySearch}
                                                    onChange={e => setCategorySearch(e.target.value)}
                                                    className="w-full bg-background border border-border/50 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                />
                                            </div>
                                        </div>
                                        <div className="max-h-60 overflow-y-auto no-scrollbar py-2">
                                            {filteredCategories.length > 0 ? (
                                                filteredCategories.map(cat => (
                                                    <button
                                                        key={cat.id}
                                                        type="button"
                                                        onClick={() => { setSelectedCategoryId(cat.id); setIsCategoryDropdownOpen(false); setCategorySearch(''); }}
                                                        className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors text-left
                                                            ${selectedCategoryId === cat.id ? 'bg-primary/5 border-l-4 border-primary' : 'border-l-4 border-transparent'}`}
                                                    >
                                                        <div className={`w-6 h-6 rounded bg-secondary flex items-center justify-center text-[10px] font-black
                                                            ${selectedCategoryId === cat.id ? 'text-primary' : 'text-muted-foreground'}`}>
                                                            {cat.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-foreground">{cat.name}</p>
                                                            <p className="text-[10px] text-muted-foreground line-clamp-1">{cat.description}</p>
                                                        </div>
                                                    </button>
                                                ))
                                            ) : (
                                                <p className="p-4 text-center text-xs text-muted-foreground">No categories found</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Form Fields */}
                        <div className={`space-y-6 transition-all duration-500 ${!selectedCategoryId ? 'opacity-30 pointer-events-none grayscale' : 'opacity-100'}`}>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Discussion Title</label>
                                <input
                                    required
                                    value={form.title}
                                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                                    className="w-full bg-secondary/30 border border-border rounded-2xl px-6 py-4 text-xl font-bold text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all"
                                    placeholder="What's on your mind?"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1 flex justify-between">
                                    Content
                                    <span className="text-primary hover:underline cursor-pointer flex items-center gap-1 normal-case tracking-normal" onClick={() => setForm(p => ({ ...p, body: p.body + '\n\n' }))}>
                                        Markdown Supported
                                    </span>
                                </label>
                                <div className="rounded-2xl border border-border overflow-hidden focus-within:ring-2 focus-within:ring-primary transition-all">
                                    <MarkdownEditor 
                                        value={form.body} 
                                        onChange={v => setForm(p => ({ ...p, body: v }))} 
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between px-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tags</label>
                                    <button 
                                        type="button" 
                                        onClick={autoSuggestTags}
                                        className="text-[10px] font-black uppercase text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                                    >
                                        <Sparkles size={10} /> AI Suggest
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {form.tags.map(t => (
                                        <span key={t} className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-2 group">
                                            #{t}
                                            <X size={12} className="cursor-pointer hover:text-foreground" onClick={() => removeTag(t)} />
                                        </span>
                                    ))}
                                </div>
                                <input
                                    placeholder="Add up to 5 tags (Press Enter)"
                                    value={formTagInput}
                                    onChange={e => setFormTagInput(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                                    className="w-full bg-secondary/30 border border-border rounded-2xl px-6 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                                />
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer Actions */}
                <div className="px-8 py-6 border-t border-border bg-accent/5 flex items-center justify-between">
                    <div className="flex-1 mr-8">
                        {error && (
                            <div className="flex items-center gap-2 text-destructive text-xs font-bold animate-in slide-in-from-left-2 duration-300">
                                <AlertCircle size={14} />
                                {error}
                            </div>
                        )}
                        {!error && similarPosts.length > 0 && (
                            <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-2">
                                <Sparkles size={12} className="text-primary" />
                                {similarPosts.length} similar posts found. Check them to avoid duplicates!
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                        <button type="button" onClick={onClose} className="px-6 py-3 text-sm font-bold text-muted-foreground hover:bg-secondary rounded-2xl transition-all">
                            Discard
                        </button>
                        <button
                            onClick={handleCreate}
                            disabled={creating || !selectedCategoryId || !form.title.trim()}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-2xl font-black shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
                        >
                            {creating ? 'Publishing...' : 'Post Discussion'}
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
