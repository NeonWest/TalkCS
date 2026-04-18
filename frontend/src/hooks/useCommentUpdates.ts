import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export function useCommentUpdates(
    postId: string | undefined,
    token: string | null,
    onRefresh: () => void
) {
    const onRefreshRef = useRef(onRefresh);
    useEffect(() => { onRefreshRef.current = onRefresh; });

    useEffect(() => {
        if (!postId || !token) return;
        const client = new Client({
            webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
            connectHeaders: { Authorization: `Bearer ${token}` },
            reconnectDelay: 5000,
            onConnect: () => {
                client.subscribe(`/topic/post/${postId}`, () => {
                    onRefreshRef.current();
                });
            },
        });
        client.activate();
        return () => { client.deactivate(); };
    }, [postId, token]);
}
