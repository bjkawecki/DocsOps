import { Card } from '@mantine/core';
import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

/**
 * Shared reading chrome for document-like pages (Help, etc.).
 * Typography SSoT: `.document-content` in DocumentContent.css – do not add parallel scales.
 */
export function DocumentReadingSurface({ children }: Props) {
  return (
    <Card className="document-page-card document-content" w="100%" padding={0}>
      {children}
    </Card>
  );
}
