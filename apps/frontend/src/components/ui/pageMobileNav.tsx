import { useMediaQuery } from '@mantine/hooks';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import { IconLayoutSidebar } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { WIDE_MIN_WIDTH } from '../appShell/appShellLayoutConstants.js';
import { PageMobileActionBar, type PageMobileAction } from './PageMobileActionBar.js';

const PageMobileNavOpenContext = createContext<RefObject<(() => void) | null> | null>(null);

type ExtraActionsRegistrar = (registrantId: string, actions: PageMobileAction[]) => () => void;

const PageMobileExtraActionsContext = createContext<ExtraActionsRegistrar | null>(null);

/** Provides the Content-Nav drawer `open` ref to nested page chrome (e.g. Admin tabs). */
export function PageMobileNavOpenProvider({
  openRef,
  children,
}: {
  openRef: RefObject<(() => void) | null>;
  children: ReactNode;
}) {
  return (
    <PageMobileNavOpenContext.Provider value={openRef}>{children}</PageMobileNavOpenContext.Provider>
  );
}

export function usePageMobileNavOpenRef(): RefObject<(() => void) | null> | null {
  return useContext(PageMobileNavOpenContext);
}

/** Build a gray sidebar FAB that opens the Content-Nav drawer. */
export function buildPageMobileNavAction(
  _navTitle: string,
  openNav: () => void,
  label: string
): PageMobileAction {
  return {
    key: 'content-nav',
    label,
    icon: <IconLayoutSidebar size={16} stroke={1.5} />,
    tone: 'nav',
    onClick: openNav,
  };
}

/**
 * Host for compact Content-Nav + optional extra FABs from nested routes.
 * Renders one `PageMobileActionBar`: [nav, ...extra].
 */
export function PageMobileActionsHost({
  navTitle,
  compactNavOpenRef,
  children,
  hidden = false,
}: {
  navTitle: string;
  compactNavOpenRef: RefObject<(() => void) | null>;
  children: ReactNode;
  hidden?: boolean;
}) {
  const { t } = useTranslation('shell');
  const isWide = useMediaQuery(WIDE_MIN_WIDTH) ?? true;
  const [extraByRegistrant, setExtraByRegistrant] = useState<Record<string, PageMobileAction[]>>(
    {}
  );

  const register = useCallback<ExtraActionsRegistrar>((registrantId, actions) => {
    setExtraByRegistrant((prev) => ({ ...prev, [registrantId]: actions }));
    return () => {
      setExtraByRegistrant((prev) => {
        if (!(registrantId in prev)) return prev;
        const next = { ...prev };
        delete next[registrantId];
        return next;
      });
    };
  }, []);

  const extraActions = useMemo(
    () => Object.values(extraByRegistrant).flat(),
    [extraByRegistrant]
  );

  const actions = useMemo((): PageMobileAction[] => {
    if (isWide) return [];
    const nav = buildPageMobileNavAction(
      navTitle,
      () => compactNavOpenRef.current?.(),
      t('nav.contentNavOpenAria', { title: navTitle })
    );
    return [nav, ...extraActions];
  }, [compactNavOpenRef, extraActions, isWide, navTitle, t]);

  return (
    <PageMobileNavOpenProvider openRef={compactNavOpenRef}>
      <PageMobileExtraActionsContext.Provider value={register}>
        {children}
        <PageMobileActionBar
          ariaLabel={t('nav.pageMobileActionsAria')}
          actions={actions}
          hidden={hidden || isWide}
        />
      </PageMobileExtraActionsContext.Provider>
    </PageMobileNavOpenProvider>
  );
}

/** Register extra compact FABs into the nearest `PageMobileActionsHost` (e.g. Create). */
export function useRegisterPageMobileExtraActions(
  actions: PageMobileAction[],
  enabled = true
): void {
  const register = useContext(PageMobileExtraActionsContext);
  const registrantId = useId();

  useEffect(() => {
    if (!enabled || register == null) return;
    return register(registrantId, actions);
  }, [actions, enabled, register, registrantId]);
}

/** Compact Content-Nav wiring for pages that own a single FAB stack. */
export function useCompactContentNavFab(navTitle: string): {
  isWide: boolean;
  compactNavOpenRef: RefObject<(() => void) | null>;
  contentNavOpenRefProp: RefObject<(() => void) | null> | undefined;
  navFab: ReactNode;
} {
  const { t } = useTranslation('shell');
  const isWide = useMediaQuery(WIDE_MIN_WIDTH) ?? true;
  const compactNavOpenRef = useRef<(() => void) | null>(null);
  const navFab =
    !isWide ? (
      <PageMobileActionBar
        ariaLabel={t('nav.pageMobileActionsAria')}
        actions={[
          buildPageMobileNavAction(
            navTitle,
            () => compactNavOpenRef.current?.(),
            t('nav.contentNavOpenAria', { title: navTitle })
          ),
        ]}
      />
    ) : null;

  return {
    isWide,
    compactNavOpenRef,
    contentNavOpenRefProp: isWide ? undefined : compactNavOpenRef,
    navFab,
  };
}
