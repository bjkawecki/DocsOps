import { Badge, type BadgeProps } from '@mantine/core';
import type { ReactNode } from 'react';
import './TagBadge.css';

type TagBadgeProps = {
  children: ReactNode;
  size?: BadgeProps['size'];
};

/**
 * Neutral document/catalog tag chip. Readable in light and dark (shared CSS with metadata pills).
 */
export function TagBadge({ children, size = 'sm' }: TagBadgeProps) {
  return (
    <Badge size={size} radius="sm" variant="outline" className="app-tag-badge" tt="none" fw={500}>
      {children}
    </Badge>
  );
}
