import { Group, Text, Tooltip } from '@mantine/core';
import { IconArrowUp } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { AppVersionLabel } from './AppVersionLabel.js';
import { useAdminUpdateStatus } from '../hooks/useAdminUpdateStatus.js';
import classes from './AdminAppVersionLabel.module.css';

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

  const updateHint = (
    <Group gap={4} wrap="nowrap" component="span" className={classes.hint}>
      <IconArrowUp size={14} color="currentColor" aria-hidden={!isMiniRail} />
      {!isMiniRail ? (
        <Text component="span" size="xs" className={classes.hintText}>
          update available
        </Text>
      ) : null}
    </Group>
  );

  const versionLabel = (
    <Link to="/admin/system" className={classes.link}>
      <Group gap={isMiniRail ? 4 : 8} wrap="nowrap" justify={isMiniRail ? 'center' : 'flex-start'}>
        <AppVersionLabel variant="compact" ta={ta} pl={pl} fz={fz} lh={lh} />
        {isMiniRail ? <span aria-label="Update available">{updateHint}</span> : updateHint}
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
