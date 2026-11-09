import { useState } from 'react';
import { Badge, Card, Collapse, Group, Stack, Text, Title, UnstyledButton } from '@mantine/core';
import { IconCalendar, IconChevronDown, IconPackage } from '@tabler/icons-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { changelogMarkdownComponents } from './ChangelogMarkdown';
import { formatReleaseDate, type LandingRelease } from '../content/releases';

type Props = {
  release: LandingRelease;
  isLatest: boolean;
  latestBadge: string;
  noBodyLabel: string;
  defaultExpanded?: boolean;
};

export function ChangelogReleaseCard({
  release,
  isLatest,
  latestBadge,
  noBodyLabel,
  defaultExpanded = false,
}: Props) {
  const [opened, setOpened] = useState(defaultExpanded);
  const hasBody = release.markdown.trim().length > 0;
  const bodyId = `landing-release-body-${release.version}`;

  return (
    <Card
      withBorder
      padding="lg"
      radius="md"
      style={{ backgroundColor: 'var(--landing-surface-2)' }}
      className="landing-surface-card"
    >
      <Stack gap={opened && hasBody ? 'sm' : 0}>
        <UnstyledButton
          type="button"
          aria-expanded={opened}
          aria-controls={hasBody ? bodyId : undefined}
          disabled={!hasBody}
          onClick={() => {
            if (hasBody) setOpened((value) => !value);
          }}
          style={{
            width: '100%',
            cursor: hasBody ? 'pointer' : 'default',
            textAlign: 'left',
            borderRadius: 'var(--mantine-radius-sm)',
            minHeight: 44,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Group align="flex-start" wrap="nowrap" gap="xs" w="100%">
            {hasBody ? (
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
            ) : null}
            <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
              <Group justify="space-between" align="center" wrap="nowrap" gap="sm" w="100%">
                <Group gap="sm" align="center" wrap="nowrap" style={{ minWidth: 0 }}>
                  <IconPackage
                    size={22}
                    stroke={1.5}
                    color="var(--mantine-color-gray-4)"
                    aria-hidden
                    style={{ flexShrink: 0 }}
                  />
                  <Title order={2} size="h3" m={0} lh={1.2}>
                    v{release.version}
                  </Title>
                </Group>
                {isLatest ? (
                  <Badge
                    variant="outline"
                    color="blue"
                    className="landing-latest-badge"
                    style={{ flexShrink: 0, marginLeft: 'auto' }}
                  >
                    {latestBadge}
                  </Badge>
                ) : null}
              </Group>
              <Group gap={6} c="dimmed" wrap="nowrap">
                <IconCalendar size={14} aria-hidden />
                <Text size="sm">{formatReleaseDate(release.date)}</Text>
              </Group>
            </Stack>
          </Group>
        </UnstyledButton>

        {hasBody ? (
          <Collapse expanded={opened}>
            <Stack id={bodyId} gap={0} pt="xs" pl={28}>
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={changelogMarkdownComponents}>
                {release.markdown}
              </ReactMarkdown>
            </Stack>
          </Collapse>
        ) : (
          <Text size="sm" c="dimmed" pt="xs">
            {noBodyLabel}
          </Text>
        )}
      </Stack>
    </Card>
  );
}
