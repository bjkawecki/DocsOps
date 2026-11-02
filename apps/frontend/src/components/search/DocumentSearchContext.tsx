import { createContext, useContext, type ReactNode } from 'react';

type DocumentSearchContextValue = {
  openSearch: (initialQuery?: string) => void;
};

const DocumentSearchContext = createContext<DocumentSearchContextValue | null>(null);

export function DocumentSearchProvider({
  value,
  children,
}: {
  value: DocumentSearchContextValue;
  children: ReactNode;
}) {
  return <DocumentSearchContext.Provider value={value}>{children}</DocumentSearchContext.Provider>;
}

/** Opens the AppShell document search modal (Ctrl/Cmd+K). */
export function useAppDocumentSearch(): DocumentSearchContextValue {
  const ctx = useContext(DocumentSearchContext);
  if (!ctx) {
    throw new Error('useAppDocumentSearch must be used within AppShell');
  }
  return ctx;
}
