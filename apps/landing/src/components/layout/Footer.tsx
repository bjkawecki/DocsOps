import { Anchor, Box, Container, Group, SimpleGrid, Stack, Text } from '@mantine/core';
import { Link } from 'react-router-dom';
import { getDemoUrl, getGithubRepoUrl, getInstallDocsUrl } from '../../config/env';
import { footerCopy, modellNavLinks } from '../../content/siteCopy';

export function Footer() {
  const demoUrl = getDemoUrl();
  const githubUrl = getGithubRepoUrl();
  const installUrl = getInstallDocsUrl();
  const year = new Date().getFullYear();

  return (
    <Box
      component="footer"
      py="xl"
      mt="xl"
      style={{ borderTop: '1px solid var(--mantine-color-dark-5)' }}
    >
      <Container size="lg">
        <SimpleGrid cols={{ base: 1, sm: 4 }} spacing="xl">
          <Stack gap="xs">
            <Text fw={600}>{footerCopy.productTitle}</Text>
            <Anchor component={Link} to="/warum" c="dimmed" underline="never">
              {footerCopy.links.warum}
            </Anchor>
            <Anchor href={demoUrl} target="_blank" rel="noreferrer" c="dimmed" underline="never">
              {footerCopy.links.demo}
            </Anchor>
          </Stack>

          <Stack gap="xs">
            <Text fw={600}>{footerCopy.modellTitle}</Text>
            {modellNavLinks.map((link) => (
              <Anchor key={link.href} href={link.href} c="dimmed" underline="never">
                {link.label}
              </Anchor>
            ))}
          </Stack>

          <Stack gap="xs">
            <Text fw={600}>{footerCopy.projectTitle}</Text>
            <Anchor href={githubUrl} target="_blank" rel="noreferrer" c="dimmed" underline="never">
              {footerCopy.links.github}
            </Anchor>
            <Anchor href={installUrl} target="_blank" rel="noreferrer" c="dimmed" underline="never">
              {footerCopy.links.install}
            </Anchor>
          </Stack>

          <Stack gap="xs">
            <Text fw={600}>{footerCopy.legalTitle}</Text>
            <Anchor component={Link} to="/impressum" c="dimmed" underline="never">
              {footerCopy.links.impressum}
            </Anchor>
            <Anchor component={Link} to="/datenschutz" c="dimmed" underline="never">
              {footerCopy.links.datenschutz}
            </Anchor>
          </Stack>
        </SimpleGrid>

        <Group justify="center" mt="xl">
          <Text size="sm" c="dimmed">
            {footerCopy.meta(year)}
          </Text>
        </Group>
      </Container>
    </Box>
  );
}
