import { LandingHead } from '../components/LandingHead';
import { LandingPageLayout } from '../components/LandingPageLayout';
import { sponsorCopy } from '../content/siteCopy';

export function SponsorPage() {
  return (
    <>
      <LandingHead
        title={`${sponsorCopy.title} – DocsOps`}
        description={sponsorCopy.metaDescription}
      />
      <LandingPageLayout title={sponsorCopy.title} intro={sponsorCopy.intro} />
    </>
  );
}
