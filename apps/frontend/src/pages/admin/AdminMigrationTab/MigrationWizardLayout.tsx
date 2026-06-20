import type { ReactNode } from 'react';
import { Group, Stack, Stepper } from '@mantine/core';

type Step = {
  label: string;
  description?: string;
};

type Props = {
  activeStep: number;
  steps: Step[];
  children: ReactNode;
  footer: ReactNode;
};

export function MigrationWizardLayout({ activeStep, steps, children, footer }: Props) {
  return (
    <Stack gap="md">
      <Group align="flex-start" wrap="nowrap" gap="xl">
        <Stepper active={activeStep} orientation="vertical" size="sm" style={{ minWidth: 200 }}>
          {steps.map((step) => (
            <Stepper.Step key={step.label} label={step.label} description={step.description} />
          ))}
        </Stepper>
        <Stack gap="md" style={{ flex: 1, minWidth: 0 }}>
          {children}
        </Stack>
      </Group>
      {footer}
    </Stack>
  );
}
