import { Anchor, Box, Button, Container, Group, Image, Menu } from '@mantine/core';
import { Link } from 'react-router-dom';
import { getDemoUrl, getGithubRepoUrl } from '../../config/env';
import { modellNavLinks, navbarCopy } from '../../content/siteCopy';

export function Navbar() {
  const demoUrl = getDemoUrl();
  const githubUrl = getGithubRepoUrl();

  return (
    <Box
      component="header"
      py="md"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        borderBottom: '1px solid var(--mantine-color-dark-5)',
        backgroundColor: 'rgba(16, 16, 16, 0.92)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <Container size="lg">
        <Group justify="space-between" wrap="nowrap">
          <Anchor component={Link} to="/" underline="never" c="white">
            <Group gap="sm" wrap="nowrap">
              <Image src="/docops-dark.svg" alt="" w={28} h={28} fit="contain" />
              <Box component="span" fw={700} fz="lg">
                DocsOps
              </Box>
            </Group>
          </Anchor>

          <Group gap="lg" visibleFrom="sm">
            <Menu trigger="hover" openDelay={80} closeDelay={120} withinPortal>
              <Menu.Target>
                <Anchor href="/#scope" c="dimmed" underline="never">
                  {navbarCopy.modell}
                </Anchor>
              </Menu.Target>
              <Menu.Dropdown>
                {modellNavLinks.map((link) => (
                  <Menu.Item key={link.href} component="a" href={link.href}>
                    {link.label}
                  </Menu.Item>
                ))}
              </Menu.Dropdown>
            </Menu>
            <Anchor component={Link} to="/warum" c="dimmed" underline="never">
              {navbarCopy.warum}
            </Anchor>
            <Anchor href={githubUrl} target="_blank" rel="noreferrer" c="dimmed" underline="never">
              {navbarCopy.github}
            </Anchor>
          </Group>

          <Button component="a" href={demoUrl} target="_blank" rel="noreferrer">
            {navbarCopy.demoCta}
          </Button>
        </Group>
      </Container>
    </Box>
  );
}
