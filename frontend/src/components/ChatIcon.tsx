import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUnreadChatCount } from '../api/chat';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { MessageCircle } from 'lucide-react';

export default function ChatIcon() {
    const navigate = useNavigate();
    const [count, setCount] = useState(0);

    useEffect(() => {
        const fetchCount = async () => {
            try { 
                const countVal = await getUnreadChatCount();
                setCount(countVal); 
            } catch (error) {
                console.error("Failed to fetch unread chat count:", error);
            }
        };
        
        fetchCount();
        const id = setInterval(fetchCount, 30000);
        return () => clearInterval(id);
    }, []);

    return (
        <Button
            size="icon"
            variant="ghost"
            onClick={() => navigate('/chat')}
            className="group relative text-foreground hover:bg-primary/10 hover:text-primary transition-all duration-300 rounded-xl"
            title="Messages"
        >
            <MessageCircle size={20} className="group-hover:scale-110 transition-transform" />
            {count > 0 && (
                <Badge className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-primary hover:bg-primary/90 text-primary-foreground border-none text-[10px] animate-in zoom-in duration-300">
                    {count > 9 ? '9+' : count}
                </Badge>
            )}
        </Button>
    );
}
