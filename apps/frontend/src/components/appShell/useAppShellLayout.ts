import { useEffect, useRef } from 'react';
import { useDisclosure, useFocusReturn, useMediaQuery } from '@mantine/hooks';
import {
  readSidebarCollapsedPreference,
  writeSidebarCollapsedPreference,
} from '../../lib/sidebarCollapsedPreference.js';
import {
  DESKTOP_MIN_WIDTH,
  SIDEBAR_WIDTH_EXPANDED,
  SIDEBAR_WIDTH_MINI,
} from './appShellLayoutConstants.js';

export function useAppShellLayout(
  pathname: string,
  sidebarPinned: boolean,
  sidebarCollapsed: boolean,
  onSidebarCollapsedChange: (collapsed: boolean) => void
) {
  const isDesktop = useMediaQuery(DESKTOP_MIN_WIDTH) ?? true;
  const [mobileOpened, { close: closeMobile, toggle: toggleMobile }] = useDisclosure(false);
  /** Pin only sets the start state (expanded); user may still collapse afterward. */
  const initialCollapsed = sidebarPinned
    ? false
    : sidebarCollapsed || readSidebarCollapsedPreference() === true;
  const [desktopCollapsed, { close: expandDesktop, open: collapseDesktop }] =
    useDisclosure(initialCollapsed);
  const userToggledRef = useRef(false);

  useFocusReturn({ opened: mobileOpened, shouldReturnFocus: true });

  useEffect(() => {
    closeMobile();
  }, [pathname, closeMobile]);

  useEffect(() => {
    if (userToggledRef.current) return;
    if (sidebarPinned) {
      expandDesktop();
    }
  }, [sidebarPinned, expandDesktop]);

  useEffect(() => {
    if (userToggledRef.current) return;
    if (sidebarPinned) return;
    if (sidebarCollapsed) {
      collapseDesktop();
    } else {
      expandDesktop();
    }
  }, [sidebarCollapsed, sidebarPinned, collapseDesktop, expandDesktop]);

  const toggleDesktopCollapsed = () => {
    const next = !desktopCollapsed;
    userToggledRef.current = true;
    if (next) {
      collapseDesktop();
    } else {
      expandDesktop();
    }
    writeSidebarCollapsedPreference(next);
    onSidebarCollapsedChange(next);
  };

  const isMiniRail = isDesktop && desktopCollapsed;
  const navbarWidth = isMiniRail ? SIDEBAR_WIDTH_MINI : SIDEBAR_WIDTH_EXPANDED;

  return {
    isDesktop,
    mobileOpened,
    toggleMobile,
    closeMobile,
    toggleDesktopCollapsed,
    isMiniRail,
    navbarWidth,
    mobileNavbarCollapsed: !mobileOpened,
    showDesktopToggle: isDesktop,
  };
}
