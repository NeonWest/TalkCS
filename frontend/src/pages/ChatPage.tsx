import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from '../context/AuthContext';
import {
    getConversations, getMessages, openConversation,
    type ChatConversation, type ChatMessage,
} from '../api/chat';
import { searchUsers, type LeaderboardUser } from '../api/users';
import Navbar from '../components/Navbar';

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
        <div className="h-screen bg-[#1a1a1a] text-white flex flex-col overflow-hidden">
            <Navbar />

            <div className="flex flex-1 overflow-hidden max-w-7xl mx-auto w-full border-x border-white/5 bg-[#121212]">
                {/* Sidebar */}
                <div className={`${showMobileList ? 'flex' : 'hidden'} md:flex w-full md:w-80 bg-[#1a1a1a] border-r border-white/5 flex-col shrink-0`}>
                    <div className="p-4 border-b border-white/5">
                        <div className="flex items-center justify-between mb-4">
                            <h1 className="text-xl font-bold">Messages</h1>
                            <button 
                                onClick={() => setIsSearching(!isSearching)}
                                className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition text-orange-500"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </button>
                        </div>
                        
                        {isSearching && (
                            <div ref={searchRef} className="space-y-2 relative animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="flex gap-2">
                                    <div className="flex-1 relative">
                                        <input
                                            autoFocus
                                            value={newUsername}
                                            onChange={e => { setNewUsername(e.target.value); setNewUserError(''); }}
                                            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                                            onKeyDown={e => e.key === 'Enter' && void handleOpenConversation()}
                                            placeholder="Enter username..."
                                            className="w-full bg-white/5 text-sm text-white placeholder-gray-500 rounded-xl px-4 py-2 border border-white/10 focus:outline-none focus:border-orange-500/50 transition-all"
                                        />
                                        {isSearchingUsers && (
                                            <div className="absolute right-3 top-2.5">
                                                <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => void handleOpenConversation()}
                                        className="bg-orange-500 hover:bg-orange-600 text-white text-sm px-4 py-2 rounded-xl transition font-medium"
                                    >Start</button>
                                </div>
                                {newUserError && <p className="text-xs text-red-400 pl-1">{newUserError}</p>}

                                {/* Autocomplete Dropdown */}
                                {showSuggestions && suggestions.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#252525] border border-white/10 rounded-xl shadow-2xl z-[60] overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                        <div className="py-1">
                                            {suggestions.map(sUser => (
                                                <button
                                                    key={sUser.id}
                                                    onClick={() => handleOpenConversation(sUser.username)}
                                                    className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-white/5 transition-colors text-left group"
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center text-xs font-bold shrink-0 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                                                        {sUser.username[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-200 group-hover:text-white">{sUser.username}</p>
                                                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">{sUser.role}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-3">
                                <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                                <p className="text-sm text-gray-500">Loading chats...</p>
                            </div>
                        ) : conversations.length === 0 ? (
                            <div className="px-6 py-12 text-center">
                                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-600">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </div>
                                <p className="text-sm text-gray-400 font-medium">No conversations yet</p>
                                <p className="text-xs text-gray-500 mt-1">Start a new one by clicking the + button</p>
                            </div>
                        ) : (
                            <div className="p-2 space-y-1">
                                {conversations.map(conv => (
                                    <button
                                        key={conv.id}
                                        onClick={() => { setActiveConvId(conv.id); setShowMobileList(false); }}
                                        className={`w-full text-left p-3 flex items-center gap-3 rounded-2xl transition-all duration-200
                                            ${activeConvId === conv.id 
                                                ? 'bg-orange-500/15 shadow-sm ring-1 ring-orange-500/20' 
                                                : 'hover:bg-white/5 active:scale-[0.98]'}`}
                                    >
                                        <div className="relative shrink-0">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shadow-sm
                                                ${activeConvId === conv.id ? 'bg-orange-500 text-white' : 'bg-white/10 text-orange-400'}`}>
                                                {conv.otherUsername[0].toUpperCase()}
                                            </div>
                                            {conv.unreadCount > 0 && (
                                                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center border-2 border-[#1a1a1a]">
                                                    {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline mb-0.5">
                                                <p className={`text-sm font-semibold truncate ${activeConvId === conv.id ? 'text-orange-400' : 'text-gray-100'}`}>
                                                    {conv.otherUsername}
                                                </p>
                                            </div>
                                            {conv.lastMessage && (
                                                <p className={`text-xs truncate ${conv.unreadCount > 0 ? 'text-gray-200 font-medium' : 'text-gray-500'}`}>
                                                    {conv.lastMessage}
                                                </p>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Chat Area */}
                <div className={`${!showMobileList ? 'flex' : 'hidden'} md:flex flex-1 flex flex-col bg-[#121212] overflow-hidden`}>
                    {!activeConvId ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
                            <div className="w-20 h-20 bg-white/5 rounded-[40px] flex items-center justify-center mb-6 text-gray-700">
                                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-bold text-gray-100 mb-2">Your Messages</h2>
                            <p className="text-gray-500 max-w-sm">Select a conversation from the sidebar to start chatting with other students.</p>
                            <button 
                                onClick={() => setShowMobileList(true)}
                                className="mt-6 md:hidden px-6 py-2 bg-orange-500 rounded-xl font-semibold"
                            >
                                View Conversations
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Chat Header */}
                            <div className="bg-[#1a1a1a]/80 backdrop-blur-md border-b border-white/5 px-4 md:px-6 py-3 flex items-center justify-between shrink-0 z-10">
                                <div className="flex items-center gap-3 md:gap-4">
                                    <button 
                                        onClick={() => setShowMobileList(true)}
                                        className="md:hidden p-2 -ml-2 text-gray-400 hover:text-white"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-orange-500/10">
                                        {activeConv?.otherUsername[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <button
                                            onClick={() => navigate(`/profile/${activeConv?.otherUsername}`)}
                                            className="text-base font-bold text-gray-100 hover:text-orange-500 transition block text-left"
                                        >
                                            {activeConv?.otherUsername}
                                        </button>
                                        <span className="text-[10px] text-orange-500 font-medium tracking-wider uppercase">Active Chat</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => navigate(`/profile/${activeConv?.otherUsername}`)} className="p-2 text-gray-400 hover:text-white transition rounded-full hover:bg-white/5">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Message List */}
                            <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-4 custom-scrollbar">
                                {messages.map((msg, idx) => {
                                    const isMe = msg.senderUsername === user?.username;
                                    const prevMsg = messages[idx - 1];
                                    const showAvatar = !prevMsg || prevMsg.senderUsername !== msg.senderUsername;
                                    
                                    return (
                                        <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'} ${!showAvatar ? 'mt-[-12px]' : ''}`}>
                                            <div className={`w-6 h-6 rounded-full shrink-0 mb-1 flex items-center justify-center text-[10px] font-bold
                                                ${!showAvatar ? 'opacity-0' : 'bg-white/10 text-orange-400'}`}>
                                                {msg.senderUsername[0].toUpperCase()}
                                            </div>
                                            <div className={`max-w-[75%] lg:max-w-[60%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                                <div className={`px-4 py-2.5 rounded-2xl text-[13.5px] leading-relaxed break-words shadow-sm
                                                    ${isMe
                                                        ? 'bg-orange-500 text-white rounded-br-none'
                                                        : 'bg-[#252525] text-gray-200 rounded-bl-none border border-white/5'}`}
                                                >
                                                    <p>{msg.content}</p>
                                                </div>
                                                {showAvatar && (
                                                    <span className="text-[10px] text-gray-500 mt-1 px-1">
                                                        {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Message Input */}
                            <div className="p-4 bg-[#1a1a1a] border-t border-white/5">
                                <div className="max-w-4xl mx-auto flex gap-3 items-end">
                                    <div className="flex-1 relative group">
                                        <textarea
                                            rows={1}
                                            value={input}
                                            onChange={e => setInput(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                                            placeholder="Message..."
                                            className="w-full bg-white/5 text-white placeholder-gray-500 rounded-[20px] pl-5 pr-12 py-3 text-sm border border-white/10 focus:outline-none focus:border-orange-500/50 transition-all resize-none max-h-32 custom-scrollbar group-hover:bg-white/[0.07]"
                                            onInput={(e) => {
                                                const target = e.target as HTMLTextAreaElement;
                                                target.style.height = 'auto';
                                                target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
                                            }}
                                        />
                                        <button
                                            onClick={handleSend}
                                            disabled={!input.trim()}
                                            className="absolute right-2 bottom-2 p-2 text-orange-500 hover:text-orange-400 disabled:opacity-0 disabled:scale-90 transition-all duration-200"
                                        >
                                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M2.01 21L23 12L2.01 3L2 10l15 2l-15 2z" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
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
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.1);
                }
            `}</style>
        </div>
    );
}
