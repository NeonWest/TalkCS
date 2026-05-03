import { createContext } from 'react';

export interface UIContextType {
    isPostComposerOpen: boolean;
    composerInitialCategoryId: number | null;
    openPostComposer: (categoryId?: number) => void;
    closePostComposer: () => void;
}

export const UIContext = createContext<UIContextType | undefined>(undefined);
