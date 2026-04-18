import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from '../context/AuthContext';
import {
    getConversations, getMessages, openConversation,
    type ChatConversation, type ChatMessage,
} from '../api/chat';
import ChatIcon from '../components/ChatIcon';
import NotificationBell from '../components/NotificationBell';

export default function ChatPage() {
    const { user, token, logout } = useAuth();
    const navigate = useNavigate();

    const [conversations, setConversations] = useState<ChatConversation[]>([]);
    const [activeConvId, setActiveConvId] = useState<number | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [newUsername, setNewUsername] = useState('');
    const [newUserError, setNewUserError] = useState('');
    const [loading, setLoading] = useState(true);

    const stompRef = useRef<Client | null>(null);
    const activeConvIdRef = useRef<number | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => { activeConvIdRef.current = activeConvId; }, [activeConvId]);

    useEffect(() => {
        getConversations()
            .then(setConversations)
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!token) return;
        const client = new Client({
            webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
            connectHeaders: { Authorization: `Bearer ${token}` },
            reconnectDelay: 5000,
            onConnect: () => {
                client.subscribe('/user/queue/messages', (frame) => {
                    const msg: ChatMessage = JSON.parse(frame.body);
                    if (msg.conversationId === activeConvIdRef.current) {
                        setMessages(prev => [...prev, msg]);
                    } else {
                        setConversations(prev => prev.map(c =>
                            c.id === msg.conversationId
                                ? { ...c, unreadCount: c.unreadCount + 1, lastMessage: msg.content }
                                : c
                        ));
                    }
                });
            },
        });
        stompRef.current = client;
        client.activate();
        return () => { client.deactivate(); };
    }, [token]);

    useEffect(() => {
        if (!activeConvId) return;
        getMessages(activeConvId).then(msgs => {
            setMessages(msgs);
            setConversations(prev => prev.map(c =>
                c.id === activeConvId ? { ...c, unreadCount: 0 } : c
            ));
        });
    }, [activeConvId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
        if (!input.trim() || !activeConvId || !stompRef.current?.connected) return;
        stompRef.current.publish({
            destination: '/app/chat.send',
            body: JSON.stringify({ conversationId: activeConvId, content: input.trim() }),
        });
        setInput('');
    };

    const handleOpenConversation = async () => {
        if (!newUsername.trim()) return;
        setNewUserError('');
        try {
            const conv = await openConversation(newUsername.trim());
            setConversations(prev =>
                prev.some(c => c.id === conv.id) ? prev : [conv, ...prev]
            );
            setActiveConvId(conv.id);
            setNewUsername('');
        } catch {
            setNewUserError('User not found');
        }
    };

    const activeConv = conversations.find(c => c.id === activeConvId);

    return (
        <div className="min-h-screen bg-[#1a1a1a] text-white flex flex-col">
            {/* Navbar */}
            <nav className="bg-[#252525] border-b border-white/10 px-6 py-3 flex items-center justify-between shrink-0">
                <button onClick={() => navigate('/')} className="text-xl font-bold text-orange-500">TalkCS</button>
                <div className="flex items-center gap-3">
                    <ChatIcon />
                    <NotificationBell />
                    <button onClick={() => navigate(`/profile/${user?.username}`)}
                        className="text-sm text-gray-300 hover:text-white transition">
                        {user?.username}
                    </button>
                    <button onClick={logout}
                        className="text-sm text-gray-400 hover:text-red-400 transition">
                        Logout
                    </button>
                </div>
            </nav>

            {/* Split pane */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left: conversation list */}
                <div className="w-72 bg-[#252525] border-r border-white/10 flex flex-col shrink-0">
                    {/* New conversation */}
                    <div className="p-3 border-b border-white/10">
                        <div className="flex gap-2">
                            <input
                                value={newUsername}
                                onChange={e => { setNewUsername(e.target.value); setNewUserError(''); }}
                                onKeyDown={e => e.key === 'Enter' && void handleOpenConversation()}
                                placeholder="Start chat with username…"
                                className="flex-1 bg-[#333] text-sm text-white placeholder-gray-500 rounded-lg px-3 py-2 border border-white/10 focus:outline-none focus:border-orange-500/50"
                            />
                            <button
                                onClick={() => void handleOpenConversation()}
                                className="bg-orange-500 hover:bg-orange-600 text-white text-sm px-3 py-2 rounded-lg transition"
                            >+</button>
                        </div>
                        {newUserError && <p className="text-xs text-red-400 mt-1">{newUserError}</p>}
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <p className="text-sm text-gray-500 text-center py-8">Loading…</p>
                        ) : conversations.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-8">No conversations yet</p>
                        ) : (
                            conversations.map(conv => (
                                <button
                                    key={conv.id}
                                    onClick={() => setActiveConvId(conv.id)}
                                    className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition border-b border-white/5
                                        ${activeConvId === conv.id ? 'bg-orange-500/10 border-l-2 border-l-orange-500' : ''}`}
                                >
                                    <div className="w-9 h-9 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-sm font-bold shrink-0">
                                        {conv.otherUsername[0].toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-200 truncate">{conv.otherUsername}</p>
                                        {conv.lastMessage && (
                                            <p className="text-xs text-gray-500 truncate">{conv.lastMessage}</p>
                                        )}
                                    </div>
                                    {conv.unreadCount > 0 && (
                                        <span className="bg-orange-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                                            {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                                        </span>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Right: message thread */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {!activeConvId ? (
                        <div className="flex-1 flex items-center justify-center">
                            <p className="text-gray-500 text-sm">Select a conversation or start a new one</p>
                        </div>
                    ) : (
                        <>
                            {/* Thread header */}
                            <div className="bg-[#252525] border-b border-white/10 px-6 py-3 flex items-center gap-3 shrink-0">
                                <div className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-sm font-bold">
                                    {activeConv?.otherUsername[0].toUpperCase()}
                                </div>
                                <button
                                    onClick={() => navigate(`/profile/${activeConv?.otherUsername}`)}
                                    className="text-sm font-semibold text-gray-200 hover:text-orange-400 transition"
                                >
                                    {activeConv?.otherUsername}
                                </button>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-2">
                                {messages.map(msg => {
                                    const isMe = msg.senderUsername === user?.username;
                                    return (
                                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl text-sm break-words
                                                ${isMe
                                                    ? 'bg-orange-500 text-white rounded-br-sm'
                                                    : 'bg-[#333] text-gray-200 rounded-bl-sm'}`}
                                            >
                                                <p>{msg.content}</p>
                                                <p className={`text-xs mt-1 ${isMe ? 'text-orange-200' : 'text-gray-500'}`}>
                                                    {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <div className="bg-[#252525] border-t border-white/10 px-4 py-3 flex gap-3 shrink-0">
                                <input
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                                    placeholder="Type a message…"
                                    className="flex-1 bg-[#333] text-white placeholder-gray-500 rounded-xl px-4 py-2 text-sm border border-white/10 focus:outline-none focus:border-orange-500/50"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim()}
                                    className="bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl text-sm font-medium transition"
                                >
                                    Send
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
