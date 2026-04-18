import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUnreadChatCount } from '../api/chat';

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
        <button
            onClick={() => navigate('/chat')}
            className="relative text-gray-300 hover:text-white transition p-1"
            title="Messages"
        >
            <span className="text-lg">💬</span>
            {count > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                    {count > 9 ? '9+' : count}
                </span>
            )}
        </button>
    );
}
