import { Stack, Text, Anchor, Loader } from '@mantine/core';
import {
  IconBuildingSkyscraper,
  IconFileText,
  IconRocket,
  IconSitemap,
  IconUsersGroup,
} from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { useMePulseStartHere, type MePulseStartHereItem } from '../../hooks/useMePulseStartHere.js';

type Props = {
  enabled: boolean;
};

const SCOPE_ICON_SIZE = 16;

function startHereScopeIcon(scopeType: MePulseStartHereItem['scopeType']) {
  if (scopeType === 'company') {
    return <IconBuildingSkyscraper size={SCOPE_ICON_SIZE} stroke={1.5} aria-hidden />;
  }
  if (scopeType === 'department') {
    return <IconSitemap size={SCOPE_ICON_SIZE} stroke={1.5} aria-hidden />;
  }
  if (scopeType === 'team') {
    return <IconUsersGroup size={SCOPE_ICON_SIZE} stroke={1.5} aria-hidden />;
  }
  return <IconFileText size={SCOPE_ICON_SIZE} stroke={1.5} aria-hidden />;
}

/**
 * Start here section for Pulse home (heading + one doc per scope).
 */
export function PulseStartHereSection({ enabled }: Props) {
  const { data, isPending, isError } = useMePulseStartHere(enabled);
  const items = data?.items ?? [];

  if (!enabled) return null;
  if (!isPending && !isError && items.length === 0) return null;

  return (
    <div className="pulse-home-column pulse-start-here-column">
      <Stack gap={10} className="pulse-start-here-section">
        <div className="pulse-explore-heading-block">
          <span className="pulse-explore-heading-icon" aria-hidden>
            <IconRocket size={22} stroke={1.5} />
          </span>
          <Text size="lg" fw={400} c="dimmed" className="pulse-explore-heading">
            Start here
          </Text>
        </div>
        {isPending ? <Loader size="sm" /> : null}
        {isError ? (
          <Text size="sm" c="dimmed">
            Could not load start documents.
          </Text>
        ) : null}
        {!isPending && !isError && items.length > 0 ? (
          <div
            className="pulse-explore-grid"
            style={{ ['--pulse-explore-cols' as string]: Math.min(items.length, 3) }}
          >
            {items.map((item) => (
              <Anchor
                key={`${item.scopeType}:${item.scopeId}`}
                component={Link}
                to={`/documents/${item.documentId}`}
                size="md"
                className="pulse-explore-link pulse-start-here-link"
              >
                <span className="pulse-explore-scope-icon">
                  {startHereScopeIcon(item.scopeType)}
                </span>
                <span className="pulse-start-here-link-text">
                  {item.title.trim() || 'Untitled'}
                </span>
              </Anchor>
            ))}
          </div>
        ) : null}
      </Stack>
    </div>
  );
}
