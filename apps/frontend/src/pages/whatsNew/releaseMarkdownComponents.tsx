import { Box, Group, Text, Anchor, Code, Title } from '@mantine/core';
import type { Components } from 'react-markdown';
import { isValidElement, type ReactNode } from 'react';
import { whatsNewSectionIcon } from './whatsNewSectionIcons.js';

function nodeToPlainText(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(nodeToPlainText).join('');
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return nodeToPlainText(node.props.children);
  }
  return '';
}

export const releaseMarkdownComponents: Partial<Components> = {
  h1: ({ children }) => (
    <Title order={1} size="h2" fw={700} lh={1.25} mt={0} mb="sm">
      {children}
    </Title>
  ),
  h2: ({ children }) => (
    <Text component="h2" size="md" fw={600} mt="sm" mb={4} lh={1.4}>
      {children}
    </Text>
  ),
  h3: ({ children }) => {
    const title = nodeToPlainText(children);
    const sectionIcon = whatsNewSectionIcon(title);
    if (!sectionIcon) {
      return (
        <Text component="h3" size="sm" fw={600} mt="sm" mb={4} lh={1.4}>
          {children}
        </Text>
      );
    }
    const { Icon, color } = sectionIcon;
    return (
      <Group gap={6} mt="sm" mb={4} align="center" wrap="nowrap">
        <Icon size={16} color={color} aria-hidden style={{ flexShrink: 0 }} />
        <Text component="h3" size="sm" fw={600} lh={1.4}>
          {children}
        </Text>
      </Group>
    );
  },
  p: ({ children }) => (
    <Text component="p" size="sm" mb="xs" lh={1.45}>
      {children}
    </Text>
  ),
  ul: ({ children }) => (
    <Box component="ul" mb="xs" pl="1.1rem" m={0} style={{ lineHeight: 1.45 }}>
      {children}
    </Box>
  ),
  ol: ({ children }) => (
    <Box component="ol" mb="xs" pl="1.1rem" m={0} style={{ lineHeight: 1.45 }}>
      {children}
    </Box>
  ),
  li: ({ children }) => (
    <Box component="li" mb={3} style={{ lineHeight: 1.45 }}>
      <Text span size="sm" lh={1.45}>
        {children}
      </Text>
    </Box>
  ),
  strong: ({ children }) => (
    <Text component="strong" span fw={600}>
      {children}
    </Text>
  ),
  a: ({ href, children }) =>
    href ? (
      <Anchor href={href} target="_blank" rel="noreferrer noopener" size="sm">
        {children}
      </Anchor>
    ) : (
      <Text component="span">{children}</Text>
    ),
  code: ({ children }) => <Code>{children}</Code>,
  blockquote: ({ children }) => (
    <Box
      component="blockquote"
      pl="sm"
      mb="xs"
      style={{ borderLeft: '3px solid var(--mantine-color-default-border)' }}
    >
      {children}
    </Box>
  ),
};
