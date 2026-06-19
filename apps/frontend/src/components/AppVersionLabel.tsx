import { Text, type TextProps } from '@mantine/core';
import { useAppVersion } from '../hooks/useAppVersion';

function formatVersionLabel(variant: 'brand' | 'label' | 'compact', version: string): string {
  if (variant === 'brand') return `DocsOps · v${version}`;
  if (variant === 'compact') return `v${version}`;
  return `Version ${version}`;
}

type Props = {
  /** Login footer: "DocsOps · v0.1.0". Shell: "v0.1.0" (compact). */
  variant?: 'brand' | 'label' | 'compact';
} & Partial<Pick<TextProps, 'ta' | 'mt' | 'mb' | 'pl' | 'fz' | 'lh'>>;

export function AppVersionLabel({ variant = 'label', ta, mt, mb, pl, fz, lh }: Props) {
  const { data, isError, isPending } = useAppVersion();

  if (isPending || isError || !data?.version) {
    return null;
  }

  return (
    <Text
      component="span"
      size="xs"
      c="dimmed"
      ta={ta}
      mt={mt}
      mb={mb}
      pl={pl}
      fz={fz}
      lh={lh}
      aria-label={`Installed app version ${data.version}`}
    >
      {formatVersionLabel(variant, data.version)}
    </Text>
  );
}
