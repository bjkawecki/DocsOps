import { useState } from 'react';
import { Badge, Card, Collapse, Group, Stack, Text, Title, UnstyledButton } from '@mantine/core';
import { IconCalendar, IconChevronDown, IconPackage } from '@tabler/icons-react';
import type { ReleaseDetailResponse } from 'backend/api-types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { formatReleaseDate } from './formatReleaseDate.js';
import { releaseMarkdownComponents } from './releaseMarkdownComponents.js';

type Props = {
  release: ReleaseDetailResponse;
  isLatest: boolean;
  isInstalled: boolean;
  defaultExpanded?: boolean;
};

export function WhatsNewReleaseCard({
  release,
  isLatest,
  isInstalled,
  defaultExpanded = false,
}: Props) {
  const [opened, setOpened] = useState(defaultExpanded);
  const showStatusBadges = isLatest || isInstalled;
  const hasBody = release.markdown.trim().length > 0;

  return (
    <Card
      withBorder
      padding="lg"
      radius="md"
      bg="light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-7))"
    >
      <Stack gap={opened && hasBody ? 'sm' : 0}>
        <UnstyledButton
          type="button"
          aria-expanded={opened}
          aria-controls={`release-body-${release.version}`}
          disabled={!hasBody}
          onClick={() => hasBody && setOpened((value) => !value)}
          style={{
            width: '100%',
            cursor: hasBody ? 'pointer' : 'default',
            textAlign: 'left',
            borderRadius: 'var(--mantine-radius-sm)',
          }}
        >
          <Group align="flex-start" wrap="nowrap" gap="xs">
            {hasBody && (
              <IconChevronDown
                size={18}
                stroke={1.75}
                aria-hidden
                style={{
                  flexShrink: 0,
                  marginTop: 6,
                  color: 'var(--mantine-color-dimmed)',
                  transition: 'transform 0.2s ease',
                  transform: opened ? 'rotate(0deg)' : 'rotate(-90deg)',
                }}
              />
            )}
            <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
              <Group justify="space-between" align="center" wrap="wrap" gap="sm">
                <Group gap="sm" align="center" wrap="nowrap">
                  <IconPackage
                    size={22}
                    stroke={1.5}
                    color="var(--mantine-color-dimmed)"
                    aria-hidden
                    style={{ flexShrink: 0 }}
                  />
                  <Title order={2} size="h3" m={0} lh={1.2}>
                    v{release.version}
                  </Title>
                </Group>
                {showStatusBadges && (
                  <Group gap="xs" wrap="wrap" style={{ flexShrink: 0 }}>
                    {isLatest && (
                      <Badge variant="light" color="violet">
                        Latest
                      </Badge>
                    )}
                    {isInstalled && (
                      <Badge variant="light" color="blue">
                        Installed
                      </Badge>
                    )}
                  </Group>
                )}
              </Group>
              <Group gap={6} c="dimmed" wrap="nowrap">
                <IconCalendar size={14} aria-hidden />
                <Text size="xs">{formatReleaseDate(release.date)}</Text>
              </Group>
            </Stack>
          </Group>
        </UnstyledButton>

        {hasBody && (
          <Collapse in={opened}>
            <Stack id={`release-body-${release.version}`} gap={0} pt="xs" pl={28}>
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={releaseMarkdownComponents}>
                {release.markdown}
              </ReactMarkdown>
            </Stack>
          </Collapse>
        )}
      </Stack>
    </Card>
  );
}
