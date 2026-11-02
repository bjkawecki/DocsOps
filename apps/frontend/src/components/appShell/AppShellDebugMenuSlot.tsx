import { lazy, Suspense, type ComponentProps } from 'react';
import type { AppShellDebugMenu } from './AppShellDebugMenu.js';

type AppShellDebugMenuProps = ComponentProps<typeof AppShellDebugMenu>;

const debugMenuEnabled = import.meta.env.DEV;

const LazyAppShellDebugMenu = debugMenuEnabled
  ? lazy(async () => {
      const mod = await import('./AppShellDebugMenu.js');
      return { default: mod.AppShellDebugMenu };
    })
  : null;

/** Dev-only debug menu (tree-shaken from production builds). */
export function AppShellDebugMenuSlot(props: AppShellDebugMenuProps) {
  if (!LazyAppShellDebugMenu) return null;
  return (
    <Suspense fallback={null}>
      <LazyAppShellDebugMenu {...props} />
    </Suspense>
  );
}
