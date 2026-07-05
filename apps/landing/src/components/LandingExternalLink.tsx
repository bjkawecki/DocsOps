import { Anchor, type AnchorProps, Button, type ButtonProps, Group, Text } from '@mantine/core';
import { IconExternalLink } from '@tabler/icons-react';
import type { ReactNode } from 'react';

type LandingExternalLinkProps = {
  href: string;
  children: ReactNode;
  showIcon?: boolean;
  onClick?: () => void;
} & Omit<AnchorProps, 'href' | 'component' | 'target' | 'rel' | 'children' | 'onClick'>;

export function LandingExternalLink({
  href,
  children,
  showIcon = true,
  onClick,
  ...anchorProps
}: LandingExternalLinkProps) {
  return (
    <Anchor
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      {...anchorProps}
    >
      <Group component="span" gap={6} wrap="nowrap" display="inline-flex">
        <Text span inherit>
          {children}
        </Text>
        {showIcon ? (
          <IconExternalLink size={14} stroke={1.75} aria-hidden style={{ flexShrink: 0 }} />
        ) : null}
      </Group>
    </Anchor>
  );
}

type LandingExternalButtonProps = {
  href: string;
  children: ReactNode;
  showIcon?: boolean;
} & Omit<ButtonProps, 'href' | 'component' | 'target' | 'rel' | 'children'>;

export function LandingExternalButton({
  href,
  children,
  showIcon = true,
  leftSection,
  ...buttonProps
}: LandingExternalButtonProps) {
  return (
    <Button
      component="a"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      leftSection={
        leftSection ??
        (showIcon ? <IconExternalLink size={16} stroke={1.75} aria-hidden /> : undefined)
      }
      {...buttonProps}
    >
      {children}
    </Button>
  );
}
