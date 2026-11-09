import { Stack, Text } from '@mantine/core';
import { ChangelogReleaseCard } from '../components/ChangelogReleaseCard';
import { LandingHead } from '../components/LandingHead';
import { LandingPageLayout } from '../components/LandingPageLayout';
import { useLandingCopy } from '../content/useLandingCopy';
import { getLandingReleases } from '../content/releases';

export function ChangelogPage() {
  const { site } = useLandingCopy();
  const { changelogCopy } = site;
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
            <Text c="dimmed" ta="center">
              {changelogCopy.empty}
            </Text>
          ) : (
            releases.map((release, index) => (
              <ChangelogReleaseCard
                key={release.version}
                release={release}
                isLatest={index === 0}
                latestBadge={changelogCopy.latestBadge}
                noBodyLabel={changelogCopy.noBody}
                defaultExpanded={index === 0}
              />
            ))
          )}
        </Stack>
      </LandingPageLayout>
    </>
  );
}
