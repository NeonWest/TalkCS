import React, { useState, useCallback } from 'react';
import { UIContext } from './UIContextDefinition';

export function UIProvider({ children }: { children: React.ReactNode }) {
    const [isPostComposerOpen, setIsPostComposerOpen] = useState(false);
    const [composerInitialCategoryId, setComposerInitialCategoryId] = useState<number | null>(null);

    const openPostComposer = useCallback((categoryId?: number) => {
        setComposerInitialCategoryId(categoryId ?? null);
        setIsPostComposerOpen(true);
    }, []);

    const closePostComposer = useCallback(() => {
        setIsPostComposerOpen(false);
        setComposerInitialCategoryId(null);
    }, []);

    const value = {
        isPostComposerOpen,
        composerInitialCategoryId,
        openPostComposer,
        closePostComposer
    };

    return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}
