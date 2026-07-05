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
      <LandingPageLayout title={changelogCopy.title} />
    </>
  );
}
