import { Button, Code, Group, List, Paper, Stack, Text } from '@mantine/core';
import { IconExternalLink, IconPlayerPlay } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { LandingExternalButton, LandingExternalLink } from '../components/LandingExternalLink';
import { LandingHead } from '../components/LandingHead';
import { LandingPageLayout, LandingPageSection } from '../components/LandingPageLayout';
import { getDemoUrl, getInstallDocsUrl, getInstallScriptUrl } from '../config/env';
import { installCopy } from '../content/siteCopy';

const installCommand = (scriptUrl: string) => `curl -fsSL ${scriptUrl} | sudo bash`;

export function InstallPage() {
  const demoUrl = getDemoUrl();
  const installDocsUrl = getInstallDocsUrl();
  const installScriptUrl = getInstallScriptUrl();
  const command = installCommand(installScriptUrl);

  return (
    <>
      <LandingHead
        title={`${installCopy.title} – DocsOps`}
        description={installCopy.metaDescription}
      />
      <LandingPageLayout title={installCopy.title} intro={installCopy.intro}>
        <Stack gap="xl">
          <LandingPageSection title={installCopy.audienceTitle}>
            <Text ta="center" c="gray.2" lh={1.65}>
              {installCopy.audience}
            </Text>
          </LandingPageSection>

          <LandingPageSection title={installCopy.requirementsTitle}>
            <List spacing="xs" maw={480} mx="auto">
              {installCopy.requirements.map((item) => (
                <List.Item key={item}>
                  <Text c="gray.2">{item}</Text>
                </List.Item>
              ))}
            </List>
          </LandingPageSection>

          <LandingPageSection title={installCopy.installTitle}>
            <Stack gap="md" align="center">
              <Text ta="center" c="gray.3" maw={560} lh={1.65}>
                {installCopy.installHint}
              </Text>
              <Paper
                p="md"
                withBorder
                bg="dark.8"
                w="100%"
                maw={640}
                className="landing-install-code"
              >
                <Code block className="landing-install-code-inner">
                  {command}
                </Code>
              </Paper>
            </Stack>
          </LandingPageSection>

          <Stack align="center" gap="xs">
            <LandingExternalLink href={installDocsUrl} className="landing-footer-link">
              {installCopy.fullDocsLabel}
            </LandingExternalLink>
          </Stack>

          <Group justify="center" gap="md" mt="md">
            <LandingExternalButton
              href={demoUrl}
              showIcon={false}
              leftSection={<IconPlayerPlay size={18} color="var(--mantine-color-blue-4)" />}
              rightSection={<IconExternalLink size={14} stroke={1.75} aria-hidden />}
            >
              {installCopy.ctaDemo}
            </LandingExternalButton>
            <Button component={Link} to="/" variant="default">
              {installCopy.backLink}
            </Button>
          </Group>
        </Stack>
      </LandingPageLayout>
    </>
  );
}
