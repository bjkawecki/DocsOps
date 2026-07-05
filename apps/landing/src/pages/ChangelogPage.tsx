import { Anchor, Stack } from '@mantine/core';
import { Link } from 'react-router-dom';
import changelogMarkdown from '../../../../CHANGELOG.md?raw';
import { ChangelogMarkdown } from '../components/ChangelogMarkdown';
import { LandingHead } from '../components/LandingHead';
import { LandingPageLayout } from '../components/LandingPageLayout';
import { changelogCopy } from '../content/siteCopy';

export function ChangelogPage() {
  return (
    <>
      <LandingHead
        title={`${changelogCopy.title} – DocsOps`}
        description={changelogCopy.metaDescription}
      />
      <LandingPageLayout title={changelogCopy.title}>
        <Stack gap="lg" className="landing-changelog">
          <ChangelogMarkdown source={changelogMarkdown} />
          <Anchor component={Link} to="/" className="landing-footer-link" underline="always">
            {changelogCopy.backLink}
          </Anchor>
        </Stack>
      </LandingPageLayout>
    </>
  );
}
