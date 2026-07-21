import { Stack, Text, UnstyledButton } from '@mantine/core';
import { useMemo } from 'react';
import { DocumentChromeCollapsiblePanel } from './DocumentChromeCollapsiblePanel.js';

type DocumentTocNavProps = {
  numberedHeadings: { level: number; text: string; id: string; numbering: string }[];
};

const TOC_INDENT_PX = 14;

function scrollHeadingIntoView(id: string) {
  const target = document.getElementById(id);
  if (target == null) return;
  const scrollRoot = document.querySelector('.document-page-scroll');
  if (scrollRoot instanceof HTMLElement) {
    const rootRect = scrollRoot.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    scrollRoot.scrollTo({
      top: scrollRoot.scrollTop + (targetRect.top - rootRect.top) - 12,
      behavior: 'smooth',
    });
    return;
  }
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/** Collapsible TOC; same row style as more-documents, plus numbering/indent. */
export function DocumentTocNav({ numberedHeadings }: DocumentTocNavProps) {
  const minLevel = useMemo(() => {
    if (numberedHeadings.length === 0) return 1;
    return Math.min(...numberedHeadings.map((h) => Math.max(h.level, 1)));
  }, [numberedHeadings]);

  if (numberedHeadings.length === 0) return null;

  return (
    <DocumentChromeCollapsiblePanel sectionId="doc-page:toc" title="Contents" defaultOpen>
      <Stack
        component="nav"
        gap={4}
        aria-label="Table of contents"
        style={{ maxHeight: 220, overflow: 'auto' }}
      >
        {numberedHeadings.map((h) => {
          const depth = Math.max(h.level, 1) - minLevel;
          return (
            <UnstyledButton
              key={h.id}
              component="a"
              href={`#${h.id}`}
              className="document-chrome-nav-link"
              onClick={(e) => {
                e.preventDefault();
                scrollHeadingIntoView(h.id);
              }}
              style={{
                paddingLeft: 4 + depth * TOC_INDENT_PX,
              }}
            >
              <Text component="span" c="dimmed" inherit>
                {h.numbering}{' '}
              </Text>
              {h.text}
            </UnstyledButton>
          );
        })}
      </Stack>
    </DocumentChromeCollapsiblePanel>
  );
}
