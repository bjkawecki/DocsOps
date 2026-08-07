import { Box, Button, Flex, NavLink, Stack } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconArrowLeft } from '@tabler/icons-react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { WIDE_MIN_WIDTH } from '../../components/appShell/appShellLayoutConstants.js';
import { SettingsAccountTab } from './SettingsAccountTab.js';
import { SettingsAppearanceTab } from './SettingsAppearanceTab.js';
import { SettingsGeneralTab } from './SettingsGeneralTab.js';
import { SettingsNotificationsTab } from './SettingsNotificationsTab.js';
import { SettingsPulseTab } from './SettingsPulseTab.js';
import { SettingsSecurityTab } from './SettingsSecurityTab.js';
import { SettingsStorageTab } from './SettingsStorageTab.js';
import {
  getSettingsJumpId,
  openSettingsSearchParams,
  SETTINGS_CONTENT_MAX_WIDTH,
  SETTINGS_JUMP_IDS,
  SETTINGS_QUERY_KEY,
  settingsCardDomId,
  type SettingsJumpId,
} from './settingsLayout.js';
import { SETTINGS_JUMP_ICON_COMPONENTS, SETTINGS_JUMP_ICON_SIZE } from './settingsIcons.js';

const SETTINGS_NAV_WIDTH = 200;
/** Ignore scrollspy while programmatic scroll settles. */
const SCROLL_SETTLE_MS = 400;
/** Treat as end of list so the last card can become active. */
const SCROLL_BOTTOM_EDGE_PX = 80;
/**
 * When the last card’s top enters the upper portion of the pane, force it active.
 * Needed because the final section often cannot scroll past a near-top marker.
 */
const LAST_CARD_ACTIVE_RATIO = 0.5;

const navLinkFullWidth = {
  borderRadius: 'var(--mantine-radius-sm)',
  width: '100%',
} as const;

function parseJumpIdAttr(raw: string | null): SettingsJumpId | null {
  if (raw == null || !SETTINGS_JUMP_IDS.includes(raw as SettingsJumpId)) return null;
  return raw as SettingsJumpId;
}

function resolveActiveJumpFromScroll(root: HTMLElement): SettingsJumpId | null {
  const cards = root.querySelectorAll<HTMLElement>('[data-settings-card]');
  if (cards.length === 0) return null;

  const rootRect = root.getBoundingClientRect();
  const last = cards[cards.length - 1];
  if (last == null) return null;
  const lastId = parseJumpIdAttr(last.getAttribute('data-settings-card'));

  const distanceFromBottom = root.scrollHeight - root.scrollTop - root.clientHeight;
  if (lastId != null && distanceFromBottom <= SCROLL_BOTTOM_EDGE_PX) {
    return lastId;
  }

  if (
    lastId != null &&
    last.getBoundingClientRect().top <= rootRect.top + rootRect.height * LAST_CARD_ACTIVE_RATIO
  ) {
    return lastId;
  }

  const markerY = rootRect.top + Math.max(24, rootRect.height * 0.2);
  let active: SettingsJumpId | null = null;
  for (const card of cards) {
    const id = parseJumpIdAttr(card.getAttribute('data-settings-card'));
    if (id == null) continue;
    if (card.getBoundingClientRect().top <= markerY) {
      active = id;
    }
  }
  return active ?? parseJumpIdAttr(cards[0]?.getAttribute('data-settings-card') ?? null);
}

function SettingsAllSections() {
  return (
    <>
      <SettingsGeneralTab />
      <SettingsAppearanceTab />
      <SettingsAccountTab />
      <SettingsSecurityTab />
      <SettingsStorageTab />
      <SettingsPulseTab />
      <SettingsNotificationsTab />
    </>
  );
}

/** Compact: only the tab that contains the focused jump card. */
function SettingsFocusedSections({ jumpId }: { jumpId: SettingsJumpId }) {
  if (jumpId === 'profile' || jumpId === 'identity') return <SettingsGeneralTab />;
  if (jumpId === 'appearance') return <SettingsAppearanceTab />;
  if (jumpId === 'email' || jumpId === 'password') return <SettingsAccountTab />;
  if (jumpId === 'sessions') return <SettingsSecurityTab />;
  if (jumpId === 'storage') return <SettingsStorageTab />;
  if (jumpId === 'pulse') return <SettingsPulseTab />;
  return <SettingsNotificationsTab />;
}

export function SettingsPanel() {
  const { t } = useTranslation('settings');
  const [searchParams, setSearchParams] = useSearchParams();
  const isWide = useMediaQuery(WIDE_MIN_WIDTH) ?? true;
  const settingsRaw = searchParams.get(SETTINGS_QUERY_KEY);
  const compactShowContent =
    !isWide &&
    settingsRaw != null &&
    settingsRaw !== '' &&
    SETTINGS_JUMP_IDS.includes(settingsRaw as SettingsJumpId);
  const jumpId = getSettingsJumpId(searchParams);
  const [activeJumpId, setActiveJumpId] = useState<SettingsJumpId>(jumpId);
  const [endPadPx, setEndPadPx] = useState(240);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const compactFocusRef = useRef<HTMLDivElement | null>(null);
  const ignoreSpyUntilRef = useRef(0);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  const handledNavJumpRef = useRef<SettingsJumpId | null>(null);
  const lastUrlJumpRef = useRef<SettingsJumpId | null>(null);

  const markProgrammaticScroll = useCallback(() => {
    ignoreSpyUntilRef.current = Date.now() + SCROLL_SETTLE_MS;
    if (settleTimerRef.current != null) clearTimeout(settleTimerRef.current);
    settleTimerRef.current = setTimeout(() => {
      ignoreSpyUntilRef.current = 0;
    }, SCROLL_SETTLE_MS);
  }, []);

  const scrollToJump = useCallback(
    (id: SettingsJumpId, behavior: ScrollBehavior = 'smooth') => {
      const root = scrollRef.current;
      const el = document.getElementById(settingsCardDomId(id));
      if (root == null || el == null) return false;
      markProgrammaticScroll();
      setActiveJumpId(id);
      const top =
        el.getBoundingClientRect().top - root.getBoundingClientRect().top + root.scrollTop;
      root.scrollTo({ top: Math.max(0, top), behavior });
      return true;
    },
    [markProgrammaticScroll]
  );

  const selectJump = useCallback(
    (id: SettingsJumpId) => {
      handledNavJumpRef.current = id;
      setActiveJumpId(id);
      setSearchParams(openSettingsSearchParams(searchParams, id), { replace: true });
      if (isWide) {
        scrollToJump(id, 'smooth');
      }
    },
    [isWide, scrollToJump, searchParams, setSearchParams]
  );

  const backToNav = useCallback(() => {
    setSearchParams(openSettingsSearchParams(searchParams), { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const root = scrollRef.current;
    if (root == null || !isWide) return;
    const update = () => {
      setEndPadPx(Math.max(240, root.clientHeight - 32));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(root);
    return () => ro.disconnect();
  }, [isWide]);

  useEffect(() => {
    const root = scrollRef.current;
    if (root == null || !isWide) return;

    const onScroll = () => {
      if (rafRef.current != null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        if (Date.now() < ignoreSpyUntilRef.current) return;
        const id = resolveActiveJumpFromScroll(root);
        if (id == null) return;
        setActiveJumpId((prev) => (prev === id ? prev : id));
      });
    };

    root.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      root.removeEventListener('scroll', onScroll);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [isWide]);

  useEffect(() => {
    if (!isWide) return;
    if (handledNavJumpRef.current === jumpId) {
      handledNavJumpRef.current = null;
      lastUrlJumpRef.current = jumpId;
      return;
    }
    if (lastUrlJumpRef.current === jumpId) {
      return;
    }
    lastUrlJumpRef.current = jumpId;
    setActiveJumpId(jumpId);

    const tryScroll = () => {
      scrollToJump(jumpId, 'auto');
    };
    const frame = requestAnimationFrame(tryScroll);
    const t1 = window.setTimeout(tryScroll, 100);
    const t2 = window.setTimeout(tryScroll, 300);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [isWide, jumpId, scrollToJump]);

  useEffect(() => {
    return () => {
      if (settleTimerRef.current != null) clearTimeout(settleTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!compactShowContent) return;
    setActiveJumpId(jumpId);
  }, [compactShowContent, jumpId]);

  useLayoutEffect(() => {
    if (!compactShowContent) return;
    const root = compactFocusRef.current;
    if (root == null) return;
    root.querySelectorAll<HTMLElement>('[data-settings-card]').forEach((el) => {
      el.style.display = el.getAttribute('data-settings-card') === jumpId ? '' : 'none';
    });
  }, [compactShowContent, jumpId]);

  const nav = (
    <Stack component="nav" gap={2} align="stretch" w="100%" aria-label={t('nav.ariaLabel')}>
      {SETTINGS_JUMP_IDS.map((id) => {
        const Icon = SETTINGS_JUMP_ICON_COMPONENTS[id];
        return (
          <NavLink
            key={id}
            label={t(`nav.${id}`)}
            leftSection={<Icon size={SETTINGS_JUMP_ICON_SIZE} stroke={1.5} />}
            active={activeJumpId === id}
            aria-current={activeJumpId === id ? 'true' : undefined}
            variant="subtle"
            style={navLinkFullWidth}
            onClick={() => selectJump(id)}
          />
        );
      })}
    </Stack>
  );

  if (!isWide) {
    if (!compactShowContent) {
      return (
        <Box style={{ flex: 1, minHeight: 0, overflowY: 'auto' }} p={4}>
          {nav}
        </Box>
      );
    }

    return (
      <Flex direction="column" gap="sm" h="100%" mih={0} style={{ flex: 1, minHeight: 0 }}>
        <Button
          variant="subtle"
          size="sm"
          leftSection={<IconArrowLeft size={16} stroke={1.5} />}
          onClick={backToNav}
          style={{ alignSelf: 'flex-start' }}
        >
          {t('nav.backToNav')}
        </Button>
        <Box
          ref={compactFocusRef}
          style={{ flex: 1, minWidth: 0, minHeight: 0, overflowY: 'auto' }}
        >
          <Stack gap="md" maw={SETTINGS_CONTENT_MAX_WIDTH} w="100%">
            <SettingsFocusedSections jumpId={jumpId} />
          </Stack>
        </Box>
      </Flex>
    );
  }

  return (
    <Flex gap="md" align="stretch" h="100%" mih={0} style={{ flex: 1, minHeight: 0 }}>
      <Box
        component="aside"
        data-context-sibling-nav
        style={{ flexShrink: 0, width: SETTINGS_NAV_WIDTH, minWidth: SETTINGS_NAV_WIDTH }}
      >
        {nav}
      </Box>

      <Box
        ref={scrollRef}
        style={{
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          overflowY: 'auto',
        }}
      >
        <Stack gap="md" maw={SETTINGS_CONTENT_MAX_WIDTH} w="100%" pb={0}>
          <SettingsAllSections />
          <Box h={endPadPx} aria-hidden style={{ flexShrink: 0 }} />
        </Stack>
      </Box>
    </Flex>
  );
}
