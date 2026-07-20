import { Text, type TextProps } from '@mantine/core';
import type { ReactNode } from 'react';

export type SectionLabelProps = {
  children: ReactNode;
  mb?: TextProps['mb'];
};

/** Meter-style section header: uppercase, compact, dimmed. */
export function SectionLabel({ children, mb }: SectionLabelProps) {
  return (
    <Text tt="uppercase" fz="xs" fw={600} c="dimmed" mb={mb}>
      {children}
    </Text>
  );
}
