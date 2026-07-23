import { Stack } from '@mantine/core';
import { useMePulseStartHere } from '../../hooks/useMePulseStartHere.js';
import { PulseExploreSection } from './PulseExploreSection.js';
import { PulseHomeIllustration } from './PulseHomeIllustration.js';
import { PulseStartHereSection } from './PulseStartHereSection.js';

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
  const { data, isPending, isError } = useMePulseStartHere(enabled);
  const items = data?.items ?? [];
  const startHereVisible = enabled && (isPending || isError || items.length > 0);

  return (
    <Stack gap={0} align="stretch" className={`pulse-explore pulse-explore--${layout}`}>
      <PulseStartHereSection enabled={enabled} />
      <PulseExploreSection enabled={enabled} ruled={!startHereVisible} />
      <PulseHomeIllustration layout={layout} />
    </Stack>
  );
}
