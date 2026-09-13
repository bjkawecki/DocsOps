import { ActionIcon, Tooltip } from '@mantine/core';
import type { ReactNode } from 'react';
import classes from './LeadDraftEditorToolbar.module.css';

export const ICON_SIZE = 16;

export function ToolIcon({
  label,
  active,
  disabled = false,
  disabledReason,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  disabledReason?: string;
  onClick: () => void;
  children: ReactNode;
}) {
  const control = (
    <ActionIcon
      size={28}
      variant={active ? 'filled' : 'light'}
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
    >
      {children}
    </ActionIcon>
  );
  return (
    <Tooltip label={disabled && disabledReason ? disabledReason : label} withArrow>
      <span className={classes.toolHit}>{control}</span>
    </Tooltip>
  );
}

export function HeadingTool({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Tooltip label={label} withArrow>
      <span className={classes.toolHit}>
        <ActionIcon
          size={28}
          variant={active ? 'filled' : 'light'}
          onClick={onClick}
          aria-label={label}
        >
          <span className={classes.headingLabel}>{label}</span>
        </ActionIcon>
      </span>
    </Tooltip>
  );
}
