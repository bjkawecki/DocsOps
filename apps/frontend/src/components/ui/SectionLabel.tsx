import { Text, type TextProps } from '@mantine/core';
import type { ReactNode } from 'react';

export type SectionLabelProps = {
  children: ReactNode;
  mb?: TextProps['mb'];
};

/** Content-sidebar section header: sentence case, bold, dimmed. */
export function SectionLabel({ children, mb }: SectionLabelProps) {
  return (
    <Text size="sm" fw={600} c="dimmed" mb={mb}>
      {children}
    </Text>
  );
}
