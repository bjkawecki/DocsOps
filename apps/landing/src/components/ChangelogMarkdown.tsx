import { Anchor, Box, Code, Text, Title } from '@mantine/core';
import type { Components } from 'react-markdown';

export const changelogMarkdownComponents: Partial<Components> = {
  h1: ({ children }) => (
    <Title order={2} size="h3" fw={700} lh={1.3} mt={0} mb="sm">
      {children}
    </Title>
  ),
  h2: ({ children }) => (
    <Text component="h3" size="md" fw={600} mt="md" mb={6} lh={1.4} c="gray.2">
      {children}
    </Text>
  ),
  h3: ({ children }) => (
    <Text component="h4" size="sm" fw={600} mt="sm" mb={4} lh={1.4} c="gray.2">
      {children}
    </Text>
  ),
  p: ({ children }) => (
    <Text component="p" size="md" mb="sm" lh={1.65} c="gray.3">
      {children}
    </Text>
  ),
  ul: ({ children }) => (
    <Box component="ul" mb="sm" pl="1.25rem" m={0} style={{ lineHeight: 1.65 }}>
      {children}
    </Box>
  ),
  ol: ({ children }) => (
    <Box component="ol" mb="sm" pl="1.25rem" m={0} style={{ lineHeight: 1.65 }}>
      {children}
    </Box>
  ),
  li: ({ children }) => (
    <Box component="li" mb={4} c="gray.3">
      <Text span size="md" lh={1.65}>
        {children}
      </Text>
    </Box>
  ),
  strong: ({ children }) => (
    <Text component="strong" span fw={600} c="gray.2">
      {children}
    </Text>
  ),
  a: ({ href, children }) =>
    href ? (
      <Anchor href={href} target="_blank" rel="noreferrer noopener">
        {children}
      </Anchor>
    ) : (
      <Text component="span">{children}</Text>
    ),
  code: ({ children }) => <Code style={{ fontSize: '0.9em' }}>{children}</Code>,
};
