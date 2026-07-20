import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type AppShellBreadcrumbItem = {
  key: string;
  label: string;
  to?: string;
  icon?: ReactNode;
};

type BreadcrumbsContextValue = {
  items: AppShellBreadcrumbItem[] | null;
  setItems: (items: AppShellBreadcrumbItem[] | null) => void;
};

const AppShellBreadcrumbsContext = createContext<BreadcrumbsContextValue | null>(null);

export function AppShellBreadcrumbsProvider({ children }: { children: ReactNode }) {
  const [items, setItemsState] = useState<AppShellBreadcrumbItem[] | null>(null);
  const setItems = useCallback((next: AppShellBreadcrumbItem[] | null) => {
    setItemsState(next);
  }, []);
  const value = useMemo(() => ({ items, setItems }), [items, setItems]);
  return (
    <AppShellBreadcrumbsContext.Provider value={value}>
      {children}
    </AppShellBreadcrumbsContext.Provider>
  );
}

function useBreadcrumbsContext(): BreadcrumbsContextValue {
  const ctx = useContext(AppShellBreadcrumbsContext);
  if (!ctx) {
    throw new Error('useSetAppShellBreadcrumbs must be used within AppShell');
  }
  return ctx;
}

/** Register breadcrumb trail for the shell row; clears on unmount. */
export function useSetAppShellBreadcrumbs(items: AppShellBreadcrumbItem[] | null) {
  const { setItems } = useBreadcrumbsContext();
  useEffect(() => {
    setItems(items);
    return () => setItems(null);
  }, [items, setItems]);
}

export function useAppShellBreadcrumbItems(): AppShellBreadcrumbItem[] | null {
  return useBreadcrumbsContext().items;
}
