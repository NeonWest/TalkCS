import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCommentUpdates } from './useCommentUpdates';

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

describe('useCommentUpdates', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        connectHandler = null;
    });

    it('skips activation when postId or token missing', () => {
        renderHook(() => useCommentUpdates(undefined, 'tkn', vi.fn()));
        expect(activate).not.toHaveBeenCalled();
    });

    it('calls onRefresh when frame arrives', () => {
        const onRefresh = vi.fn();
        renderHook(() => useCommentUpdates('5', 'tkn', onRefresh));

        (connectHandler as () => void).call({ subscribe } as never);
        const cb = subscribe.mock.calls[0][1] as () => void;
        cb();

        expect(onRefresh).toHaveBeenCalled();
    });

    it('deactivates on unmount', () => {
        const { unmount } = renderHook(() => useCommentUpdates('5', 'tkn', vi.fn()));
        unmount();
        expect(deactivate).toHaveBeenCalled();
    });
});
