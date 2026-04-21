"use client";

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUnreadChatCount } from '../api/chat';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

export default function ChatIcon() {
    const navigate = useNavigate();
    const [count, setCount] = useState(0);

    const fetchCount = async () => {
        try { setCount(await getUnreadChatCount()); } catch {}
    };

    useEffect(() => {
        fetchCount();
        const id = setInterval(fetchCount, 30000);
        return () => clearInterval(id);
    }, []);

    return (
        <Button
            size="icon"
            variant="ghost"
            onClick={() => navigate('/chat')}
            className="group relative text-foreground hover:bg-black/10 dark:hover:bg-accent hover:text-foreground transition-all duration-300"
            title="Messages"
        >
            <svg
                viewBox="0 0 24 24"
                height="20"
                width="20"
                xmlns="http://www.w3.org/2000/svg"
                className="group-hover:scale-110 group-hover:text-primary group-hover:fill-primary fill-current transition-all duration-300 ease-in-out"
            >
                <path
                    d="M5 18v3.766l1.515-.909L11.277 18H16c1.103 0 2-.897 2-2V8c0-1.103-.897-2-2-2H4c-1.103 0-2 .897-2 2v8c0 1.103.897 2 2 2h1zM4 8h12v8h-5.277L7 18.234V16H4V8z"
                ></path>
                <path
                    d="M20 2H8c-1.103 0-2 .897-2 2h12c1.103 0 2 .897 2 2v8c1.103 0 2-.897 2-2V4c0-1.103-.897-2-2-2z"
                ></path>
            </svg>
            {count > 0 && (
                <Badge className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-primary hover:bg-primary/90 text-primary-foreground border-none text-[10px]">
                    {count > 9 ? '9+' : count}
                </Badge>
            )}
        </Button>
    );
}
