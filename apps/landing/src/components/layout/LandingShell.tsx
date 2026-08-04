import { Box, Container } from '@mantine/core';
import { Outlet } from 'react-router-dom';
import { ScrollToTop } from '../ScrollToTop';
import { Footer } from './Footer';
import { Navbar } from './Navbar';

export function LandingShell() {
  return (
    <Box mih="100vh" bg="dark.9">
      <ScrollToTop />
      <Navbar />
      <Container size="lg" py="xl" component="main">
        <Outlet />
      </Container>
      <Footer />
    </Box>
  );
}
