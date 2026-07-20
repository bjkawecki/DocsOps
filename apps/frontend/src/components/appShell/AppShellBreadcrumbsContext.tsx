import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
  actions: ReactNode | null;
  setActions: (actions: ReactNode | null) => void;
};

const AppShellBreadcrumbsContext = createContext<BreadcrumbsContextValue | null>(null);

export function AppShellBreadcrumbsProvider({ children }: { children: ReactNode }) {
  const [items, setItemsState] = useState<AppShellBreadcrumbItem[] | null>(null);
  const [actions, setActionsState] = useState<ReactNode | null>(null);
  const setItems = useCallback((next: AppShellBreadcrumbItem[] | null) => {
    setItemsState(next);
  }, []);
  const setActions = useCallback((next: ReactNode | null) => {
    setActionsState(next);
  }, []);
  const value = useMemo(
    () => ({ items, setItems, actions, setActions }),
    [items, setItems, actions, setActions]
  );
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

/** Register breadcrumb trail for the shell row; clears only on unmount. */
export function useSetAppShellBreadcrumbs(items: AppShellBreadcrumbItem[] | null) {
  const { setItems } = useBreadcrumbsContext();
  const trailKey =
    items == null
      ? ''
      : items.map((i) => `${i.key}\u0001${i.label}\u0001${i.to ?? ''}`).join('\u0002');
  const itemsRef = useRef(items);
  itemsRef.current = items;

  useEffect(() => {
    setItems(itemsRef.current);
  }, [trailKey, setItems]);

  useEffect(() => {
    return () => setItems(null);
  }, [setItems]);
}

/**
 * Register actions for the breadcrumb chrome row (e.g. People, Create).
 * Pass a memoized node to avoid redundant context updates.
 */
export function useSetAppShellBreadcrumbActions(actions: ReactNode | null) {
  const { setActions } = useBreadcrumbsContext();
  const actionsRef = useRef(actions);
  actionsRef.current = actions;

  useEffect(() => {
    setActions(actionsRef.current);
  }, [actions, setActions]);

  useEffect(() => {
    return () => setActions(null);
  }, [setActions]);
}

export function useAppShellBreadcrumbItems(): AppShellBreadcrumbItem[] | null {
  return useBreadcrumbsContext().items;
}

export function useAppShellBreadcrumbActions(): ReactNode | null {
  return useBreadcrumbsContext().actions;
}
