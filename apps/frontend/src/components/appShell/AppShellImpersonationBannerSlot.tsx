import { lazy, Suspense, type ComponentProps } from 'react';
import type { AppShellImpersonationBanner } from './AppShellImpersonationBanner.js';

type Props = ComponentProps<typeof AppShellImpersonationBanner>;

const impersonationUiEnabled = import.meta.env.DEV;

const LazyAppShellImpersonationBanner = impersonationUiEnabled
  ? lazy(async () => {
      const mod = await import('./AppShellImpersonationBanner.js');
      return { default: mod.AppShellImpersonationBanner };
    })
  : null;

/** Dev-only impersonation banner (tree-shaken from production builds). */
export function AppShellImpersonationBannerSlot(props: Props) {
  if (!LazyAppShellImpersonationBanner) return null;
  return (
    <Suspense fallback={null}>
      <LazyAppShellImpersonationBanner {...props} />
    </Suspense>
  );
}
