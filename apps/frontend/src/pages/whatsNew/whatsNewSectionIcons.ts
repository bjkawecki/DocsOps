import type { IconProps } from '@tabler/icons-react';
import { IconBolt, IconBug, IconCircleCheck } from '@tabler/icons-react';
import type { ComponentType } from 'react';

export type WhatsNewSectionIconConfig = {
  Icon: ComponentType<IconProps>;
  color: string;
};

const SECTION_ICON_BY_TITLE: Record<string, WhatsNewSectionIconConfig> = {
  features: { Icon: IconCircleCheck, color: 'var(--mantine-color-green-filled)' },
  fixes: { Icon: IconBug, color: 'var(--mantine-color-yellow-filled)' },
  performance: { Icon: IconBolt, color: 'var(--mantine-color-violet-filled)' },
};

export function whatsNewSectionIcon(title: string): WhatsNewSectionIconConfig | null {
  const key = title.trim().toLowerCase();
  return SECTION_ICON_BY_TITLE[key] ?? null;
}
