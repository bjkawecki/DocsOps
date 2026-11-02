const STORAGE_KEY = 'docsops.sidebarCollapsed';

export function readSidebarCollapsedPreference(): boolean | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === '1') return true;
    if (raw === '0') return false;
  } catch {
    // ignore private mode / blocked storage
  }
  return null;
}

export function writeSidebarCollapsedPreference(collapsed: boolean): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0');
  } catch {
    // ignore
  }
}
