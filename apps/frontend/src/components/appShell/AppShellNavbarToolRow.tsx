import { Tooltip } from '@mantine/core';
import { SIDEBAR_MINI_ICON_SIZE } from './appShellLayoutConstants.js';
import { useTranslation } from 'react-i18next';
import { SearchIcon } from '../search/SearchIcon.js';

type Props = {
  isMiniRail: boolean;
  onOpenSearch: () => void;
};

function shortcutLabel(): string {
  if (typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    return '⌘K';
  }
  return 'Ctrl K';
}

/** Sidebar search trigger only (utilities live in the main top bar). */
export function AppShellNavbarToolRow({ isMiniRail, onOpenSearch }: Props) {
  const { t } = useTranslation('shell');
  const kbd = shortcutLabel();

  const searchTrigger = (
    <button
      type="button"
      className={
        isMiniRail
          ? 'app-shell-navbar-search-trigger app-shell-navbar-search-trigger--mini'
          : 'app-shell-navbar-search-trigger'
      }
      onClick={onOpenSearch}
      aria-label={t('nav.searchAria', { kbd })}
    >
      <SearchIcon size={SIDEBAR_MINI_ICON_SIZE} />
      {!isMiniRail ? (
        <>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {t('nav.searchEllipsis')}
          </span>
          <kbd className="app-shell-navbar-search-kbd">{kbd}</kbd>
        </>
      ) : null}
    </button>
  );

  return (
    <div
      className={
        isMiniRail
          ? 'app-shell-navbar-tool-row app-shell-navbar-tool-row--mini'
          : 'app-shell-navbar-tool-row'
      }
    >
      {isMiniRail ? (
        <Tooltip label={t('nav.searchTooltip', { kbd })} position="right" withArrow>
          {searchTrigger}
        </Tooltip>
      ) : (
        searchTrigger
      )}
    </div>
  );
}
