import { Box, NavLink, Stack, Text } from '@mantine/core';

type DocumentTocNavProps = {
  numberedHeadings: { level: number; text: string; id: string; numbering: string }[];
};

/** Sticky-friendly TOC list for the document left column. */
export function DocumentTocNav({ numberedHeadings }: DocumentTocNavProps) {
  if (numberedHeadings.length === 0) return null;

  return (
    <Box
      style={{
        border: '1px solid var(--mantine-color-default-border)',
        borderRadius: 'var(--mantine-radius-md)',
        padding: 'var(--mantine-spacing-sm)',
      }}
    >
      <Text
        fz="xs"
        fw={600}
        c="dimmed"
        mb="sm"
        style={{ paddingLeft: 'var(--mantine-spacing-xs)' }}
      >
        Table of Contents
      </Text>
      <Stack component="nav" gap={2} aria-label="Table of contents">
        {numberedHeadings.map((h) => (
          <NavLink
            key={h.id}
            href={`#${h.id}`}
            label={`${h.numbering} ${h.text}`}
            onClick={(e) => {
              e.preventDefault();
              document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth' });
            }}
            style={{
              paddingLeft: `calc(var(--mantine-spacing-xs) + ${(h.level - 1) * 10}px)`,
              paddingTop: 'var(--mantine-spacing-xs)',
              paddingBottom: 'var(--mantine-spacing-xs)',
              paddingRight: 'var(--mantine-spacing-xs)',
              fontSize: h.level >= 4 ? 'var(--mantine-font-size-xs)' : undefined,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          />
        ))}
      </Stack>
    </Box>
  );
}
