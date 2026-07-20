import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { scopeToKey, type RecentScope } from '../../hooks/useRecentItems.js';

type NavScopeContextValue = {
  scope: RecentScope | null;
  setScope: (scope: RecentScope | null) => void;
};

const AppShellNavScopeContext = createContext<NavScopeContextValue | null>(null);

export function AppShellNavScopeProvider({ children }: { children: ReactNode }) {
  const [scope, setScopeState] = useState<RecentScope | null>(null);
  const setScope = useCallback((next: RecentScope | null) => {
    setScopeState(next);
  }, []);
  const value = useMemo(() => ({ scope, setScope }), [scope, setScope]);
  return (
    <AppShellNavScopeContext.Provider value={value}>{children}</AppShellNavScopeContext.Provider>
  );
}

function useNavScopeContext(): NavScopeContextValue {
  const ctx = useContext(AppShellNavScopeContext);
  if (!ctx) {
    throw new Error('useSetAppShellNavScope must be used within AppShell');
  }
  return ctx;
}

function scopeFromKey(key: string): RecentScope {
  if (key === 'personal') return { type: 'personal' };
  if (key === 'shared') return { type: 'shared' };
  const sep = key.indexOf(':');
  const type = key.slice(0, sep) as 'company' | 'department' | 'team';
  const id = key.slice(sep + 1);
  return { type, id };
}

/** Registers the content owner scope for sidebar org highlighting; clears on unmount. */
export function useSetAppShellNavScope(scope: RecentScope | null) {
  const { setScope } = useNavScopeContext();
  const scopeKey = scope == null ? null : scopeToKey(scope);
  useEffect(() => {
    if (scopeKey == null) {
      setScope(null);
      return () => setScope(null);
    }
    setScope(scopeFromKey(scopeKey));
    return () => setScope(null);
  }, [scopeKey, setScope]);
}

export function useAppShellNavScope(): RecentScope | null {
  return useNavScopeContext().scope;
}
