import { Anchor, Divider, List, Stack, Text, Title } from '@mantine/core';
import type { ReactNode } from 'react';

function renderInlineMarkdown(text: string): ReactNode {
  const linkMatch = /\[([^\]]+)\]\(([^)]+)\)/.exec(text);
  if (linkMatch) {
    const [, label, url] = linkMatch;
    const before = text.slice(0, linkMatch.index);
    const after = text.slice(linkMatch.index + linkMatch[0].length);
    return (
      <>
        {before}
        <Anchor
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="landing-footer-link"
        >
          {label}
        </Anchor>
        {after}
      </>
    );
  }

  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <Text key={index} span fw={600}>
          {part.slice(2, -2)}
        </Text>
      );
    }
    return part;
  });
}

type ChangelogMarkdownProps = {
  source: string;
};

export function ChangelogMarkdown({ source }: ChangelogMarkdownProps) {
  const lines = source.split('\n');
  const blocks: ReactNode[] = [];
  let listItems: string[] = [];
  let listKey = 0;

  const flushList = () => {
    if (listItems.length === 0) {
      return;
    }
    blocks.push(
      <List key={`list-${listKey}`} spacing="xs" className="landing-changelog-list">
        {listItems.map((item) => (
          <List.Item key={item}>
            <Text c="gray.2" lh={1.65}>
              {renderInlineMarkdown(item)}
            </Text>
          </List.Item>
        ))}
      </List>
    );
    listItems = [];
    listKey += 1;
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === '') {
      flushList();
      continue;
    }

    if (trimmed === '---') {
      flushList();
      blocks.push(<Divider key={`hr-${blocks.length}`} my="md" color="dark.5" />);
      continue;
    }

    if (trimmed.startsWith('# ')) {
      flushList();
      continue;
    }

    if (trimmed.startsWith('## ')) {
      flushList();
      blocks.push(
        <Title key={`h2-${blocks.length}`} order={2} className="landing-page-section-title" mt="md">
          {trimmed.slice(3)}
        </Title>
      );
      continue;
    }

    if (trimmed.startsWith('### ')) {
      flushList();
      blocks.push(
        <Title
          key={`h3-${blocks.length}`}
          order={3}
          size="h4"
          className="landing-changelog-h3"
          mt="sm"
        >
          {trimmed.slice(4)}
        </Title>
      );
      continue;
    }

    if (trimmed.startsWith('- ')) {
      listItems.push(trimmed.slice(2));
      continue;
    }

    flushList();
    blocks.push(
      <Text key={`p-${blocks.length}`} c="gray.3" lh={1.65}>
        {renderInlineMarkdown(trimmed)}
      </Text>
    );
  }

  flushList();

  return <Stack gap="sm">{blocks}</Stack>;
}
