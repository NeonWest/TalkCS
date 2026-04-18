import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type { Post } from '../api/posts';

export function usePostUpdates(
    categoryId: string | undefined,
    token: string | null,
    onCreated: (post: Post) => void,
    onUpdated: (post: Post) => void,
    onDeleted: (postId: number) => void
) {
    const onCreatedRef = useRef(onCreated);
    const onUpdatedRef = useRef(onUpdated);
    const onDeletedRef = useRef(onDeleted);

    useEffect(() => { onCreatedRef.current = onCreated; });
    useEffect(() => { onUpdatedRef.current = onUpdated; });
    useEffect(() => { onDeletedRef.current = onDeleted; });

    useEffect(() => {
        if (!categoryId || !token) return;
        const client = new Client({
            webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
            connectHeaders: { Authorization: `Bearer ${token}` },
            reconnectDelay: 5000,
            onConnect: () => {
                client.subscribe(`/topic/category/${categoryId}`, (frame) => {
                    const data = JSON.parse(frame.body);
                    if (data.action === 'created') onCreatedRef.current(data.post);
                    else if (data.action === 'updated') onUpdatedRef.current(data.post);
                    else if (data.action === 'deleted') onDeletedRef.current(data.postId);
                });
            },
        });
        client.activate();
        return () => { client.deactivate(); };
    }, [categoryId, token]);
}
