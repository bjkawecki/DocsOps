import { Box, Button, Flex, Loader, Text } from '@mantine/core';

/** Fixed row height for Mantine AppShell header offset calculation. */
export const APP_SHELL_STATUS_BANNER_ROW_HEIGHT = 40;

export type AppShellStatusBannerAction = {
  label: string;
  onClick: () => void;
  color?: string;
};

type Props = {
  bg: string;
  message: string;
  loader?: boolean;
  action?: AppShellStatusBannerAction;
};

export function AppShellStatusBannerBar({ bg, message, loader = false, action }: Props) {
  return (
    <Box
      px="md"
      py={8}
      style={{
        flexShrink: 0,
        borderBottom: '1px solid var(--mantine-color-default-border)',
      }}
      bg={bg}
      role="status"
      aria-live="polite"
    >
      <Flex align="center" gap="sm" wrap="nowrap" justify="center" maw={960} mx="auto">
        {loader ? <Loader color="white" size="xs" type="oval" style={{ flexShrink: 0 }} /> : null}
        <Text size="sm" c="white" ta="center" lineClamp={1} style={{ minWidth: 0 }}>
          {message}
        </Text>
        {action ? (
          <Button
            size="xs"
            variant="white"
            color={action.color ?? 'gray'}
            onClick={action.onClick}
            style={{ flexShrink: 0 }}
          >
            {action.label}
          </Button>
        ) : null}
      </Flex>
    </Box>
  );
}
