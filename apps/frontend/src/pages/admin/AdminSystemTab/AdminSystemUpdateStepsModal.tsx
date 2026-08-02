import { useEffect, useState } from 'react';
import {
  ActionIcon,
  Anchor,
  Button,
  Code,
  Collapse,
  CopyButton,
  Group,
  List,
  Modal,
  Paper,
  Stack,
  Text,
  Tooltip,
  UnstyledButton,
} from '@mantine/core';
import { Link } from 'react-router-dom';
import { IconCheck, IconChevronDown, IconCopy, IconExternalLink } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

const modalCodeBlockStyle = {
  whiteSpace: 'pre',
  maxWidth: '100%',
  minWidth: 0,
  overflowX: 'auto',
} as const;

const AGENT_ENV_EXAMPLE = `DOCSOPS_AGENT_URL=http://host.docker.internal:8091
DOCSOPS_AGENT_TOKEN=<token from install>`;

const AGENT_STATUS_COMMAND = `curl -sf -H "Authorization: Bearer <token>" \\
  http://127.0.0.1:8091/v1/status`;

type Props = {
  opened: boolean;
  onClose: () => void;
  latestReleaseTag: string | null;
  releaseUrl: string | null;
  agentConfigured?: boolean;
  agentMissingEnvVars?: string[];
};

function OneClickUpdateSetupAlert({
  missingEnvVars,
  modalOpened,
}: {
  missingEnvVars: string[];
  modalOpened: boolean;
}) {
  const { t } = useTranslation('admin');
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!modalOpened) setExpanded(false);
  }, [modalOpened]);

  return (
    <Paper withBorder p="md" radius="md">
      <UnstyledButton
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((value) => !value)}
        style={{ width: '100%', textAlign: 'left' }}
      >
        <Group justify="space-between" wrap="nowrap" gap="xs">
          <Text size="sm" fw={600} c="red">
            {t('system.updateStepsModal.oneClickNotAvailable')}
          </Text>
          <IconChevronDown
            size={18}
            aria-hidden
            style={{
              flexShrink: 0,
              color: 'var(--mantine-color-dimmed)',
              transition: 'transform 0.2s ease',
              transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)',
            }}
          />
        </Group>
      </UnstyledButton>

      <Collapse in={expanded}>
        <Stack gap="sm" pt="sm" style={{ minWidth: 0 }}>
          <Text size="sm" fw={500}>
            {t('system.updateStepsModal.missingOnInstance')}
          </Text>
          <List size="sm" spacing="xs">
            {missingEnvVars.map((name) => (
              <List.Item key={name}>
                <Code>{name}</Code> {t('system.updateStepsModal.envVarHintSuffix')}
              </List.Item>
            ))}
            <List.Item>
              <Code>docsops-agent</Code> {t('system.updateStepsModal.agentServiceHint')}
            </List.Item>
          </List>
          <Text size="sm" fw={500} mt="xs">
            {t('system.updateStepsModal.productionIncludesAgent')}
          </Text>
          <Text size="sm" c="dimmed">
            {t('system.updateStepsModal.expectedEnvEntries')}
          </Text>
          <Code block w="100%" style={modalCodeBlockStyle}>
            {AGENT_ENV_EXAMPLE}
          </Code>
          <Text size="sm" c="dimmed">
            {t('system.updateStepsModal.checkAgentHealth')}
          </Text>
          <Code block w="100%" style={modalCodeBlockStyle}>
            {AGENT_STATUS_COMMAND}
          </Code>
        </Stack>
      </Collapse>
    </Paper>
  );
}

export function AdminSystemUpdateStepsModal({
  opened,
  onClose,
  latestReleaseTag,
  releaseUrl,
  agentConfigured = false,
  agentMissingEnvVars = [],
}: Props) {
  const { t } = useTranslation('admin');
  const updateCommand = 'sudo /opt/docsops/scripts/update.sh';

  return (
    <Modal opened={opened} onClose={onClose} title={t('system.updateStepsModal.title')} size="md">
      <Stack gap="md">
        {agentConfigured ? (
          <Text size="sm">
            {t('system.updateStepsModal.productionHintBefore')}{' '}
            <strong>{t('system.updateStepsModal.productionHintPrimaryLabel')}</strong>{' '}
            {t('system.updateStepsModal.productionHintAfter')}
          </Text>
        ) : (
          <>
            <OneClickUpdateSetupAlert missingEnvVars={agentMissingEnvVars} modalOpened={opened} />
            <Text size="sm">
              {t('system.updateStepsModal.manualUpgradeHintBefore')}{' '}
              <Text component={Link} to="/admin/data/backup" fw={500}>
                {t('system.updateStepsModal.adminBackupLink')}
              </Text>{' '}
              {t('system.updateStepsModal.manualUpgradeHintAfter')}
            </Text>
          </>
        )}

        {agentConfigured ? (
          <Text size="sm" c="dimmed">
            {t('system.updateStepsModal.manualBackupHintBefore')}{' '}
            <Text component={Link} to="/admin/data/backup" fw={500}>
              {t('system.updateStepsModal.adminBackupLink')}
            </Text>
            .
          </Text>
        ) : null}

        <Text size="sm" fw={500}>
          {t('system.updateStepsModal.manualUpgradeTitle')}
        </Text>
        {latestReleaseTag == null ? (
          <Text size="sm" c="dimmed">
            {t('system.updateStepsModal.defaultVersionHintBefore')} <Code>update.sh</Code>{' '}
            {t('system.updateStepsModal.defaultVersionHintAfter')} <Code>docsops-agent</Code>{' '}
            {t('system.updateStepsModal.defaultVersionHintEnd')}
          </Text>
        ) : (
          <Text size="sm" c="dimmed">
            {t('system.updateStepsModal.pinnedVersionHintBefore')} <Code>{latestReleaseTag}</Code>.{' '}
            {t('system.updateStepsModal.pinnedVersionHintPin')}{' '}
            <Code>sudo /opt/docsops/scripts/update.sh {latestReleaseTag}</Code>
          </Text>
        )}
        <Group gap="xs" align="flex-start" wrap="nowrap" style={{ minWidth: 0 }}>
          <Code block w="100%" style={{ flex: 1, ...modalCodeBlockStyle }}>
            {updateCommand}
          </Code>
          <CopyButton value={updateCommand} timeout={2000}>
            {({ copied, copy }) => (
              <Tooltip
                label={
                  copied
                    ? t('system.updateStepsModal.copied')
                    : t('system.updateStepsModal.copyCommand')
                }
                withArrow
              >
                <ActionIcon
                  variant="light"
                  size="lg"
                  aria-label={
                    copied
                      ? t('system.updateStepsModal.copied')
                      : t('system.updateStepsModal.copyCommand')
                  }
                  onClick={copy}
                >
                  {copied ? <IconCheck size={18} /> : <IconCopy size={18} />}
                </ActionIcon>
              </Tooltip>
            )}
          </CopyButton>
        </Group>

        {releaseUrl != null && (
          <Anchor href={releaseUrl} target="_blank" rel="noreferrer" size="sm">
            <Group gap={4} component="span">
              {t('system.updateStepsModal.viewReleaseOnGithub')}
              <IconExternalLink size={14} />
            </Group>
          </Anchor>
        )}

        <Group justify="flex-end">
          <Button onClick={onClose}>{t('system.updateStepsModal.close')}</Button>
        </Group>
      </Stack>
    </Modal>
  );
}
