import { Anchor, Button } from '@mantine/core';
import type { MouseEvent, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { apiBase } from '../../api/client.js';
import { downloadScopePdfExport } from '../../api/scopePdfExportDownload.js';
import type { NotificationActionTarget } from './notificationsInboxFormatters.js';

function absoluteDownloadHref(path: string): string {
  return path.startsWith('http') ? path : `${apiBase}${path}`;
}

type NotificationActionAnchorProps = {
  target: NotificationActionTarget;
  children: ReactNode;
  /** Stop row click when used inside a clickable table row. */
  stopPropagation?: boolean;
  fw?: number;
  size?: 'sm' | 'md' | 'lg';
  lineClamp?: number;
};

/** Route -> React Router Link; download -> fetch+blob (errors stay in the SPA). */
export function NotificationActionAnchor({
  target,
  children,
  stopPropagation = false,
  fw = 600,
  size = 'sm',
  lineClamp = 2,
}: NotificationActionAnchorProps) {
  if (target.kind === 'download') {
    return (
      <Anchor
        href={absoluteDownloadHref(target.path)}
        c="inherit"
        underline="hover"
        fw={fw}
        size={size}
        lineClamp={lineClamp}
        onClick={(e: MouseEvent) => {
          e.preventDefault();
          if (stopPropagation) e.stopPropagation();
          void downloadScopePdfExport(target.path);
        }}
      >
        {children}
      </Anchor>
    );
  }

  return (
    <Anchor
      component={Link}
      to={target.path}
      c="inherit"
      underline="hover"
      fw={fw}
      size={size}
      lineClamp={lineClamp}
      onClick={
        stopPropagation
          ? (e: MouseEvent) => {
              e.stopPropagation();
            }
          : undefined
      }
    >
      {children}
    </Anchor>
  );
}

type NotificationActionButtonProps = {
  target: NotificationActionTarget;
  routeLabel: string;
  downloadLabel: string;
  onNavigate?: () => void;
};

export function NotificationActionButton({
  target,
  routeLabel,
  downloadLabel,
  onNavigate,
}: NotificationActionButtonProps) {
  if (target.kind === 'download') {
    return (
      <Button
        component="a"
        href={absoluteDownloadHref(target.path)}
        variant="filled"
        onClick={(e: MouseEvent) => {
          e.preventDefault();
          onNavigate?.();
          void downloadScopePdfExport(target.path);
        }}
      >
        {downloadLabel}
      </Button>
    );
  }

  return (
    <Button component={Link} to={target.path} variant="filled" onClick={onNavigate}>
      {routeLabel}
    </Button>
  );
}
