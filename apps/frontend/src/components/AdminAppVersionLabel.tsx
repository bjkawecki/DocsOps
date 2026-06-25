import { Group, Text, Tooltip } from '@mantine/core';
import { IconArrowUp } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { AppVersionLabel } from './AppVersionLabel.js';
import { useAdminUpdateStatus } from '../hooks/useAdminUpdateStatus.js';

type Props = {
  isAdmin: boolean;
  isMiniRail?: boolean;
  ta?: 'left' | 'center' | 'right';
  pl?: number | string;
  fz?: number | string;
  lh?: number | string;
};

export function AdminAppVersionLabel({ isAdmin, isMiniRail = false, ta, pl, fz, lh }: Props) {
  const { data: updateStatus } = useAdminUpdateStatus({ enabled: isAdmin });
  const showUpdateHint = isAdmin && updateStatus?.updateAvailable === true;

  if (!showUpdateHint) {
    return <AppVersionLabel variant="compact" ta={ta} pl={pl} fz={fz} lh={lh} />;
  }

  const versionLabel = (
    <Link to="/admin/system" style={{ textDecoration: 'none', color: 'inherit' }}>
      <Group gap={isMiniRail ? 4 : 8} wrap="nowrap" justify={isMiniRail ? 'center' : 'flex-start'}>
        <AppVersionLabel variant="compact" ta={ta} pl={pl} fz={fz} lh={lh} />
        {isMiniRail ? (
          <IconArrowUp
            size={14}
            color="var(--mantine-color-orange-6)"
            aria-label="Update available"
          />
        ) : (
          <Group gap={4} wrap="nowrap" component="span">
            <IconArrowUp size={14} color="var(--mantine-color-orange-6)" aria-hidden />
            <Text component="span" size="xs" c="orange">
              update available
            </Text>
          </Group>
        )}
      </Group>
    </Link>
  );

  if (isMiniRail) {
    return (
      <Tooltip label="Update available — open System" position="right">
        {versionLabel}
      </Tooltip>
    );
  }

  return versionLabel;
}
