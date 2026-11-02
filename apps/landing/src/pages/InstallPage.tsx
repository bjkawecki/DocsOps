import { Box, Code, Paper, Text, Title } from '@mantine/core';
import { IconCircleCheck } from '@tabler/icons-react';
import { LandingExternalButton } from '../components/LandingExternalLink';
import { LandingHead } from '../components/LandingHead';
import { getInstallDocsUrl, getInstallScriptUrl } from '../config/env';
import { installCopy } from '../content/siteCopy';

const installCommand = (scriptUrl: string) => `curl -fsSL ${scriptUrl} | sudo bash`;

export function InstallPage() {
  const installDocsUrl = getInstallDocsUrl();
  const installScriptUrl = getInstallScriptUrl();
  const command = installCommand(installScriptUrl);

  return (
    <>
      <LandingHead
        title={`${installCopy.title} · DocsOps`}
        description={installCopy.metaDescription}
      />
      <Box className="landing-page landing-page--narrow landing-subpage">
        <header className="landing-subpage-hero">
          <Title order={1} className="landing-page-title">
            {installCopy.title}
          </Title>
          <Text className="landing-subpage-intro">{installCopy.intro}</Text>
        </header>

        <section className="landing-subpage-section" aria-labelledby="install-requirements-heading">
          <Title
            order={2}
            id="install-requirements-heading"
            className="landing-subpage-section-title"
          >
            {installCopy.requirementsTitle}
          </Title>
          <ul className="landing-subpage-list">
            {installCopy.requirements.map((item) => (
              <li key={item} className="landing-subpage-list-item">
                <IconCircleCheck
                  size={18}
                  stroke={1.75}
                  className="landing-subpage-list-icon"
                  aria-hidden
                />
                <Text component="span" className="landing-subpage-body">
                  {item}
                </Text>
              </li>
            ))}
          </ul>
        </section>

        <section
          className="landing-subpage-cta landing-subpage-cta--wide"
          aria-labelledby="install-command-heading"
        >
          <Title order={2} id="install-command-heading" className="landing-subpage-section-title">
            {installCopy.installTitle}
          </Title>
          <Text className="landing-subpage-cta-body">{installCopy.installHint}</Text>
          <Paper p="md" withBorder className="landing-install-code">
            <Code block className="landing-install-code-inner">
              {command}
            </Code>
          </Paper>
          <LandingExternalButton
            href={installDocsUrl}
            variant="default"
            className="landing-hero-cta-button"
          >
            {installCopy.fullDocsLabel}
          </LandingExternalButton>
        </section>
      </Box>
    </>
  );
}
