import { Stack } from '@mantine/core';
import { PulseExploreSection } from './PulseExploreSection.js';
import { PulseHomeIllustration } from './PulseHomeIllustration.js';

export type PulseExploreLayout = 'fill' | 'footer';

type Props = {
  enabled: boolean;
  layout: PulseExploreLayout;
};

/**
 * Explore section + illustration for Pulse home.
 * `fill` = empty feed (viewport fill); `footer` = under a non-empty feed.
 */
export function PulseExploreBlock({ enabled, layout }: Props) {
  return (
    <Stack gap={0} align="stretch" className={`pulse-explore pulse-explore--${layout}`}>
      <PulseExploreSection enabled={enabled} />
      <PulseHomeIllustration layout={layout} />
    </Stack>
  );
}
