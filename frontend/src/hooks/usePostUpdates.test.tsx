import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePostUpdates } from './usePostUpdates';

let connectHandler: (() => void) | null = null;
const subscribe = vi.fn();
const activate = vi.fn();
const deactivate = vi.fn();

vi.mock('@stomp/stompjs', () => ({
    Client: class {
        activate = activate;
        deactivate = deactivate;
        subscribe = subscribe;
        constructor(cfg: { onConnect: () => void }) {
            connectHandler = cfg.onConnect;
        }
    },
}));
vi.mock('sockjs-client', () => ({
    default: vi.fn().mockImplementation(() => ({})),
}));

describe('usePostUpdates', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        connectHandler = null;
    });

    it('does not connect when categoryId or token missing', () => {
        renderHook(() => usePostUpdates(undefined, 'tkn', vi.fn(), vi.fn(), vi.fn()));
        expect(activate).not.toHaveBeenCalled();
    });

    it('activates client + subscribes on connect', () => {
        renderHook(() => usePostUpdates('1', 'tkn', vi.fn(), vi.fn(), vi.fn()));
        expect(activate).toHaveBeenCalled();
        // simulate stomp connect
        (connectHandler as () => void).call({ subscribe } as never);
    });

    it('dispatches created/updated/deleted from frame body', () => {
        const onCreated = vi.fn();
        const onUpdated = vi.fn();
        const onDeleted = vi.fn();
        renderHook(() => usePostUpdates('1', 'tkn', onCreated, onUpdated, onDeleted));

        // capture subscribe callback from inside the onConnect
        const fakeClient = { subscribe };
        (connectHandler as () => void).call(fakeClient as never);
        const cb = subscribe.mock.calls[0][1] as (f: { body: string }) => void;

        cb({ body: JSON.stringify({ action: 'created', post: { id: 1 } }) });
        cb({ body: JSON.stringify({ action: 'updated', post: { id: 2 } }) });
        cb({ body: JSON.stringify({ action: 'deleted', postId: 3 }) });

        expect(onCreated).toHaveBeenCalledWith({ id: 1 });
        expect(onUpdated).toHaveBeenCalledWith({ id: 2 });
        expect(onDeleted).toHaveBeenCalledWith(3);
    });

    it('deactivates on unmount', () => {
        const { unmount } = renderHook(() => usePostUpdates('1', 'tkn', vi.fn(), vi.fn(), vi.fn()));
        unmount();
        expect(deactivate).toHaveBeenCalled();
    });
});
