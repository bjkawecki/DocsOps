import { Anchor, Text } from '@mantine/core';

type Props = {
  currentVersion: number;
  acknowledgedVersion: number;
  onReload: () => void;
  /** When nested in a filled Alert, use light-on-color text. */
  onFilledAlert?: boolean;
};

export function DocumentPublishedVersionHint({
  currentVersion,
  acknowledgedVersion,
  onReload,
  onFilledAlert = false,
}: Props) {
  const textColor = onFilledAlert ? 'white' : 'dimmed';
  return (
    <Text size="sm" c={textColor} component="span">
      v{currentVersion} published (viewing v{acknowledgedVersion}).{' '}
      <Anchor
        component="button"
        type="button"
        size="sm"
        c={textColor}
        underline="always"
        onClick={onReload}
      >
        Reload
      </Anchor>
    </Text>
  );
}
