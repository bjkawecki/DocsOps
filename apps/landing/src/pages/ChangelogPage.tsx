import { Badge, Card, Group, Stack, Text, Title } from '@mantine/core';
import { IconCalendar, IconPackage } from '@tabler/icons-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { LandingHead } from '../components/LandingHead';
import { LandingPageLayout } from '../components/LandingPageLayout';
import { changelogMarkdownComponents } from '../components/ChangelogMarkdown';
import { changelogCopy } from '../content/siteCopy';
import { formatReleaseDate, getLandingReleases } from '../content/releases';

export function ChangelogPage() {
  const releases = getLandingReleases();

  return (
    <>
      <LandingHead
        title={`${changelogCopy.title} – DocsOps`}
        description={changelogCopy.metaDescription}
      />
      <LandingPageLayout title={changelogCopy.title} intro={changelogCopy.intro} narrow>
        <Stack gap="lg">
          {releases.length === 0 ? (
            <Text c="gray.4" ta="center">
              {changelogCopy.empty}
            </Text>
          ) : (
            releases.map((release, index) => (
              <Card
                key={release.version}
                withBorder
                padding="lg"
                radius="md"
                bg="dark.7"
                className="landing-surface-card"
              >
                <Stack gap="sm">
                  <Group justify="space-between" align="flex-start" wrap="wrap" gap="sm">
                    <Group gap="sm" align="center" wrap="nowrap">
                      <IconPackage
                        size={22}
                        stroke={1.5}
                        color="var(--mantine-color-gray-4)"
                        aria-hidden
                      />
                      <Title order={2} size="h3" m={0} lh={1.2} c="gray.1">
                        v{release.version}
                      </Title>
                    </Group>
                    {index === 0 ? (
                      <Badge variant="light" color="blue">
                        {changelogCopy.latestBadge}
                      </Badge>
                    ) : null}
                  </Group>
                  <Group gap={6} c="dimmed" wrap="nowrap">
                    <IconCalendar size={14} aria-hidden />
                    <Text size="sm">{formatReleaseDate(release.date)}</Text>
                  </Group>
                  {release.markdown.trim() ? (
                    <BoxMarkdown markdown={release.markdown} />
                  ) : (
                    <Text size="sm" c="gray.5">
                      {changelogCopy.noBody}
                    </Text>
                  )}
                </Stack>
              </Card>
            ))
          )}
        </Stack>
      </LandingPageLayout>
    </>
  );
}

function BoxMarkdown({ markdown }: { markdown: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={changelogMarkdownComponents}>
      {markdown}
    </ReactMarkdown>
  );
}
