import { Group, Stack, Text, Anchor, Loader } from '@mantine/core';
import {
  IconBuildingSkyscraper,
  IconCompass,
  IconFileText,
  IconSitemap,
  IconUsersGroup,
} from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { useMePulseExplore } from '../../hooks/useMePulseExplore.js';

type Props = {
  enabled: boolean;
  /** Top border when Start here is not shown (first visible block). */
  ruled?: boolean;
};

const SCOPE_ICON_SIZE = 16;

function exploreScopeIcon(columnKey: string) {
  if (columnKey.startsWith('company:')) {
    return <IconBuildingSkyscraper size={SCOPE_ICON_SIZE} stroke={1.5} aria-hidden />;
  }
  if (columnKey.startsWith('department:')) {
    return <IconSitemap size={SCOPE_ICON_SIZE} stroke={1.5} aria-hidden />;
  }
  if (columnKey.startsWith('team:')) {
    return <IconUsersGroup size={SCOPE_ICON_SIZE} stroke={1.5} aria-hidden />;
  }
  return <IconFileText size={SCOPE_ICON_SIZE} stroke={1.5} aria-hidden />;
}

/**
 * Explore columns for Pulse home (heading + scope grids).
 */
export function PulseExploreSection({ enabled, ruled = true }: Props) {
  const { data, isPending, isError } = useMePulseExplore(enabled);
  const columns = data?.columns ?? [];

  return (
    <div className="pulse-home-column pulse-explore-column">
      <Stack
        gap={14}
        className={`pulse-explore-section${ruled ? ' pulse-explore-section--ruled' : ''}`}
      >
        <div className="pulse-explore-heading-block">
          <span className="pulse-explore-heading-icon" aria-hidden>
            <IconCompass size={22} stroke={1.5} />
          </span>
          <Text size="lg" fw={400} c="dimmed" className="pulse-explore-heading">
            Explore documents from your scopes
          </Text>
        </div>
        {isPending ? <Loader size="sm" /> : null}
        {isError ? (
          <Text size="sm" c="dimmed">
            Could not load suggestions.
          </Text>
        ) : null}
        {!isPending && !isError && columns.length === 0 ? (
          <Text size="sm" c="dimmed">
            No documents to explore yet.
          </Text>
        ) : null}
        {!isPending && columns.length > 0 ? (
          <div
            className="pulse-explore-grid"
            style={{ ['--pulse-explore-cols' as string]: Math.min(columns.length, 3) }}
          >
            {columns.map((col) => (
              <Stack key={col.key} gap={8} className="pulse-explore-col">
                <Group gap={6} wrap="nowrap" className="pulse-explore-scope-row">
                  <span className="pulse-explore-scope-icon">{exploreScopeIcon(col.key)}</span>
                  <Text size="sm" fw={500} c="dimmed" className="pulse-explore-scope" lineClamp={1}>
                    {col.title}
                  </Text>
                </Group>
                <Stack gap={6}>
                  {col.items.map((item) => (
                    <Anchor
                      key={item.id}
                      component={Link}
                      to={`/documents/${item.id}`}
                      size="md"
                      className="pulse-explore-link"
                      lineClamp={1}
                    >
                      {item.title.trim() || 'Untitled'}
                    </Anchor>
                  ))}
                </Stack>
              </Stack>
            ))}
          </div>
        ) : null}
      </Stack>
    </div>
  );
}
