import { Box } from '@mantine/core';
import type { CSSProperties, ReactNode } from 'react';

/** Shared left-column width for context workspace and document scope shell. */
export const CONTEXT_WORKSPACE_LEFT_WIDTH = 280;

type ContextWorkspaceLeftColumnProps = {
  children: ReactNode;
  /** Stick below the top bar while scrolling (document TOC column). */
  sticky?: boolean;
  /** Extra attributes (e.g. `data-context-sibling-nav` on the sidebar). */
  'data-context-sibling-nav'?: boolean;
};

/**
 * Left chrome shared by context workspace sidebar and document page
 * (context switcher + TOC) so column width stays aligned.
 */
export function ContextWorkspaceLeftColumn({
  children,
  sticky = false,
  'data-context-sibling-nav': dataContextSiblingNav,
}: ContextWorkspaceLeftColumnProps) {
  const style: CSSProperties = {
    flexShrink: 0,
    ...(sticky
      ? {
          position: 'sticky',
          top: 'var(--mantine-spacing-xl)',
          alignSelf: 'flex-start',
        }
      : {}),
  };

  return (
    <Box
      component="aside"
      w={{ base: '100%', lg: CONTEXT_WORKSPACE_LEFT_WIDTH }}
      style={style}
      {...(dataContextSiblingNav ? { 'data-context-sibling-nav': true } : {})}
    >
      {children}
    </Box>
  );
}
