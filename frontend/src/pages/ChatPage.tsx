import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from '../context/useAuth';
import {
    getConversations, getMessages, openConversation,
    type ChatConversation, type ChatMessage,
} from '../api/chat';
import { searchUsers, type LeaderboardUser } from '../api/users';

export default function ChatPage() {
    const { user, token } = useAuth();
    const navigate = useNavigate();

    const [conversations, setConversations] = useState<ChatConversation[]>([]);
    const [activeConvId, setActiveConvId] = useState<number | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [newUsername, setNewUsername] = useState('');
    const [newUserError, setNewUserError] = useState('');
    const [loading, setLoading] = useState(true);
    const [isSearching, setIsSearching] = useState(false);
    
    // Autocomplete states
    const [suggestions, setSuggestions] = useState<LeaderboardUser[]>([]);
    const [isSearchingUsers, setIsSearchingUsers] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const [showMobileList, setShowMobileList] = useState(true);

    const stompRef = useRef<Client | null>(null);
    const activeConvIdRef = useRef<number | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => { activeConvIdRef.current = activeConvId; }, [activeConvId]);

    // Close suggestions on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (newUsername.trim().length >= 1) {
                setIsSearchingUsers(true);
                try {
                    const results = await searchUsers(newUsername);
                    setSuggestions(results);
                    setShowSuggestions(true);
                } catch (err) {
                    console.error('Search failed', err);
                } finally {
                    setIsSearchingUsers(false);
                }
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [newUsername]);

    useEffect(() => {
        getConversations()
            .then(setConversations)
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!token || !user?.id) return;
        
        // Use the base URL from import.meta.env if available, otherwise fallback to localhost
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
        console.log('Connecting to WebSocket at:', `${apiUrl}/ws`);
        
        const client = new Client({
            webSocketFactory: () => new SockJS(`${apiUrl}/ws`),
            connectHeaders: { Authorization: `Bearer ${token}` },
            reconnectDelay: 5000,
            onConnect: (frame) => {
                console.log('Connected to WebSocket:', frame);
                
                // Subscribe to the direct user topic
                const topic = `/topic/user/${user.id}/messages`;
                console.log('Subscribing to topic:', topic);
                
                client.subscribe(topic, (frame) => {
                    const msg: ChatMessage = JSON.parse(frame.body);
                    
                    const currentActiveId = Number(activeConvIdRef.current);
                    const msgConvId = Number(msg.conversationId);
                    
                    if (msgConvId === currentActiveId) {
                        setMessages(prev => {
                            const optimisticIdx = prev.findIndex(m => 
                                m.senderUsername === msg.senderUsername && 
                                m.content === msg.content && 
                                m.id > 1700000000000
                            );
                            if (optimisticIdx !== -1) {
                                const next = [...prev];
                                next[optimisticIdx] = msg;
                                return next;
                            }
                            if (prev.some(m => m.id === msg.id)) return prev;
                            return [...prev, msg];
                        });
                    }

                    // Always update sidebar with last message
                    setConversations(prev => prev.map(c =>
                        c.id === msgConvId
                            ? { 
                                ...c, 
                                lastMessage: msg.content,
                                unreadCount: msgConvId === currentActiveId ? 0 : c.unreadCount + 1 
                              }
                            : c
                    ));
                });
            },
            onStompError: (frame) => {
                console.error('STOMP error:', frame);
            },
            onWebSocketClose: () => {
                console.log('WebSocket closed');
            }
        });
        stompRef.current = client;
        client.activate();
        return () => { client.deactivate(); };
    }, [token, user?.id]);

    useEffect(() => {
        if (!activeConvId) return;
        getMessages(activeConvId).then(msgs => {
            setMessages(msgs);
            setConversations(prev => prev.map(c =>
                c.id === activeConvId ? { ...c, unreadCount: 0 } : c
            ));
        });
        setShowMobileList(false);
    }, [activeConvId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
        if (!input.trim() || !activeConvId || !stompRef.current?.connected) return;
        
        const content = input.trim();
        
        // Optimistic update for the sender
        const optimisticMsg: ChatMessage = {
            id: Date.now(), // Temp ID
            conversationId: activeConvId,
            senderUsername: user?.username || 'me',
            content: content,
            sentAt: new Date().toISOString(),
            isRead: false
        };
        setMessages(prev => [...prev, optimisticMsg]);
        
        stompRef.current.publish({
            destination: '/app/chat.send',
            body: JSON.stringify({ conversationId: activeConvId, content: content }),
        });
        setInput('');
    };

    const handleOpenConversation = async (selectedUsername?: string) => {
        const targetUsername = selectedUsername || newUsername.trim();
        if (!targetUsername) return;
        setNewUserError('');
        try {
            const conv = await openConversation(targetUsername);
            setConversations(prev =>
                prev.some(c => c.id === conv.id) ? prev : [conv, ...prev]
            );
            setActiveConvId(conv.id);
            setNewUsername('');
            setIsSearching(false);
            setShowSuggestions(false);
            setShowMobileList(false);
        } catch {
            setNewUserError('User not found');
        }
    };

    const activeConv = conversations.find(c => c.id === activeConvId);

    return (
        <div className="h-[calc(100dvh-5rem)] bg-background text-foreground flex flex-col overflow-hidden relative">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
            </div>

            <div className="flex flex-1 overflow-hidden max-w-7xl mx-auto w-full p-2 md:p-4 gap-4">
                {/* Sidebar */}
                <div className={`${showMobileList ? 'flex' : 'hidden'} md:flex w-full md:w-85 glass rounded-3xl border border-border/50 flex-col shrink-0 overflow-hidden shadow-2xl shadow-black/20`}>
                    <div className="p-5 border-b border-border/50">
                        <div className="flex items-center justify-between mb-4">
                            <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
                            <button 
                                onClick={() => setIsSearching(!isSearching)}
                                className="p-2.5 bg-primary/10 hover:bg-primary/20 rounded-2xl transition-all duration-300 text-primary group active:scale-95"
                            >
                                <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                </svg>
                            </button>
                        </div>
                        
                        {isSearching && (
                            <div ref={searchRef} className="space-y-2 relative animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="flex gap-2">
                                    <div className="flex-1 relative">
                                        <input
                                            autoFocus
                                            value={newUsername}
                                            onChange={e => { setNewUsername(e.target.value); setNewUserError(''); }}
                                            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                                            onKeyDown={e => e.key === 'Enter' && void handleOpenConversation()}
                                            placeholder="Find user..."
                                            className="w-full bg-white/5 text-sm text-foreground placeholder:text-muted-foreground rounded-2xl px-4 py-3 border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                                        />
                                        {isSearchingUsers && (
                                            <div className="absolute right-3 top-3.5">
                                                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => void handleOpenConversation()}
                                        className="bg-primary hover:bg-primary/90 text-white text-sm px-5 py-3 rounded-2xl transition-all font-semibold shadow-lg shadow-primary/20 active:scale-95"
                                    >Start</button>
                                </div>
                                {newUserError && <p className="text-xs text-destructive pl-1 font-medium">{newUserError}</p>}

                                {/* Autocomplete Dropdown */}
                                {showSuggestions && suggestions.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-3 glass-card rounded-2xl shadow-2xl z-[60] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                        <div className="py-1">
                                            {suggestions.map(sUser => (
                                                <button
                                                    key={sUser.id}
                                                    onClick={() => handleOpenConversation(sUser.username)}
                                                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors text-left group"
                                                >
                                                    <div className="w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold shrink-0 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                                        {sUser.username[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-foreground">{sUser.username}</p>
                                                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{sUser.role}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                                <p className="text-sm text-muted-foreground font-medium animate-pulse">Syncing conversations...</p>
                            </div>
                        ) : conversations.length === 0 ? (
                            <div className="px-6 py-20 text-center">
                                <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-5 text-muted-foreground border border-border/30">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </div>
                                <p className="text-base text-foreground font-bold">No messages yet</p>
                                <p className="text-sm text-muted-foreground mt-2 max-w-[200px] mx-auto">Start a conversation to connect with other students.</p>
                            </div>
                        ) : (
                            conversations.map(conv => (
                                <button
                                    key={conv.id}
                                    onClick={() => { setActiveConvId(conv.id); setShowMobileList(false); }}
                                    className={`w-full text-left p-4 flex items-center gap-4 rounded-2xl transition-all duration-300 group
                                        ${activeConvId === conv.id 
                                            ? 'bg-primary/20 shadow-lg ring-1 ring-primary/30' 
                                            : 'hover:bg-white/5 active:scale-[0.98]'}`}
                                >
                                    <div className="relative shrink-0">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold transition-all duration-300
                                            ${activeConvId === conv.id ? 'bg-primary text-white rotate-3 shadow-lg shadow-primary/30' : 'bg-white/5 text-primary group-hover:rotate-3 shadow-md'}`}>
                                            {conv.otherUsername[0].toUpperCase()}
                                        </div>
                                        {conv.unreadCount > 0 && (
                                            <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-[11px] font-bold rounded-xl px-1.5 py-0.5 min-w-[20px] h-[20px] flex items-center justify-center border-2 border-background shadow-lg animate-bounce">
                                                {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <p className={`text-base font-bold truncate transition-colors ${activeConvId === conv.id ? 'text-primary' : 'text-foreground'}`}>
                                                {conv.otherUsername}
                                            </p>
                                        </div>
                                        {conv.lastMessage && (
                                            <p className={`text-[13px] truncate ${conv.unreadCount > 0 ? 'text-foreground font-bold' : 'text-muted-foreground'}`}>
                                                {conv.lastMessage}
                                            </p>
                                        )}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Main Chat Area */}
                <div className={`${!showMobileList ? 'flex' : 'hidden'} md:flex flex-1 glass rounded-3xl border border-border/50 flex-col overflow-hidden shadow-2xl shadow-black/20 relative`}>
                    {!activeConvId ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
                            <div className="w-20 h-20 bg-accent/40 rounded-[40px] flex items-center justify-center mb-6 text-muted-foreground">
                                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-bold text-foreground mb-2">Your Messages</h2>
                            <p className="text-muted-foreground max-w-sm">Select a conversation from the sidebar to start chatting with other students.</p>
                            <button 
                                onClick={() => setShowMobileList(true)}
                                className="mt-6 md:hidden px-6 py-2 bg-primary rounded-xl font-semibold"
                            >
                                View Conversations
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Chat Header */}
                            <div className="bg-white/5 backdrop-blur-xl border-b border-border/50 px-5 md:px-8 py-4 flex items-center justify-between shrink-0 z-10 shadow-sm">
                                <div className="flex items-center gap-4">
                                    <button 
                                        onClick={() => setShowMobileList(true)}
                                        className="md:hidden p-2.5 -ml-2 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-2xl transition-all"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-lg font-bold text-white shadow-lg shadow-primary/20 rotate-2">
                                        {activeConv?.otherUsername[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <button
                                            onClick={() => navigate(`/profile/${activeConv?.otherUsername}`)}
                                            className="text-lg font-bold text-foreground hover:text-primary transition-colors block text-left leading-tight"
                                        >
                                            {activeConv?.otherUsername}
                                        </button>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="text-[10px] text-primary font-bold tracking-widest uppercase">Online Now</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => navigate(`/profile/${activeConv?.otherUsername}`)}
                                        className="p-3 text-muted-foreground hover:text-primary transition-all rounded-2xl hover:bg-primary/10 group active:scale-95"
                                    >
                                        <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Message List */}
                            <div className="flex-1 overflow-y-auto px-6 md:px-10 py-8 flex flex-col gap-6 custom-scrollbar bg-transparent">
                                {messages.map((msg, idx) => {
                                    const isMe = msg.senderUsername === user?.username;
                                    const prevMsg = messages[idx - 1];
                                    const showAvatar = !prevMsg || prevMsg.senderUsername !== msg.senderUsername;
                                    
                                    return (
                                        <div key={msg.id} className={`flex items-end gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'} ${!showAvatar ? 'mt-[-16px]' : ''} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                                            <div className={`w-8 h-8 rounded-xl shrink-0 mb-1 flex items-center justify-center text-[11px] font-bold shadow-sm transition-all duration-300
                                                ${!showAvatar ? 'opacity-0 scale-0' : isMe ? 'bg-primary/20 text-primary rotate-3' : 'bg-white/10 text-muted-foreground -rotate-3'}`}>
                                                {msg.senderUsername[0].toUpperCase()}
                                            </div>
                                            <div className={`max-w-[80%] lg:max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                                <div className={`px-5 py-3 rounded-2xl text-[14px] leading-relaxed break-words shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-[1.01]
                                                    ${isMe
                                                        ? 'bg-gradient-to-br from-primary to-primary/80 text-white rounded-br-none shadow-primary/20'
                                                        : 'bg-white/5 text-foreground rounded-bl-none border border-border/30 shadow-black/5'}`}
                                                >
                                                    <p>{msg.content}</p>
                                                </div>
                                                {showAvatar && (
                                                    <span className="text-[10px] text-muted-foreground/60 font-medium mt-1.5 px-1 tracking-tight">
                                                        {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Message Input Area - Floating Pill */}
                            <div className="p-4 md:p-6 bg-transparent relative">
                                <form 
                                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                                    className="max-w-4xl mx-auto"
                                >
                                    <div className="relative group glass rounded-[32px] shadow-2xl shadow-black/20 border border-white/10 p-2 pl-6 pr-2 flex items-end gap-3 transition-all duration-300 focus-within:ring-2 focus-within:ring-primary/30">
                                        <textarea
                                            rows={1}
                                            value={input}
                                            onChange={e => setInput(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSend();
                                                }
                                            }}
                                            placeholder="Type your message..."
                                            className="flex-1 bg-transparent text-foreground placeholder-muted-foreground/50 py-3 text-sm focus:outline-none resize-none max-h-32 custom-scrollbar"
                                            onInput={(e) => {
                                                const target = e.target as HTMLTextAreaElement;
                                                target.style.height = 'auto';
                                                target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
                                            }}
                                        />
                                        <button
                                            type="submit"
                                            onMouseDown={(e) => {
                                                if (input.trim()) e.preventDefault();
                                            }}
                                            disabled={!input.trim()}
                                            className="p-3 bg-primary text-white rounded-full hover:bg-primary/90 disabled:opacity-0 disabled:scale-75 transition-all duration-300 shadow-lg shadow-primary/20 active:scale-90 shrink-0"
                                        >
                                            <svg className="w-5 h-5 rotate-45 mr-0.5 mt-[-1px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                            </svg>
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </>
                    )}
                </div>
            </div>
            
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: var(--border);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: var(--primary);
                    opacity: 0.5;
                }
            `}</style>
        </div>
    );
}
