import { useMediaQuery } from '@mantine/hooks';
import { WIDE_MIN_WIDTH } from './appShellLayoutConstants.js';

/**
 * Content layout ≥ Mantine `lg` (tables / two-column / breadcrumb Create).
 *
 * Mantine’s default (`getInitialValueInEffect: true`) leaves the first paint as
 * `undefined || false` when no initial value is passed – and `?? true` does not
 * help. Breadcrumb syncKeys that omit `isWide` then stay stuck at `null`.
 * Read `matchMedia` on the first client paint; fall back to desktop-first `true`
 * only when `window` is unavailable.
 */
export function useWideLayout(): boolean {
  return useMediaQuery(WIDE_MIN_WIDTH, true, { getInitialValueInEffect: false });
}
