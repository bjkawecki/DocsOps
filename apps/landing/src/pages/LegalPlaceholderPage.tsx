import { Anchor, Stack, Text, Title } from '@mantine/core';
import { Link } from 'react-router-dom';
import { legalPlaceholderCopy } from '../content/siteCopy';

type LegalPlaceholderPageProps = {
  kind: 'impressum' | 'datenschutz';
};

export function LegalPlaceholderPage({ kind }: LegalPlaceholderPageProps) {
  const title =
    kind === 'impressum'
      ? legalPlaceholderCopy.impressumTitle
      : legalPlaceholderCopy.datenschutzTitle;

  return (
    <Stack gap="md" py="md" maw={640}>
      <Title order={1}>{title}</Title>
      <Text c="dimmed">{legalPlaceholderCopy.body}</Text>
      <Anchor component={Link} to="/" underline="always">
        {legalPlaceholderCopy.backLink}
      </Anchor>
    </Stack>
  );
}
