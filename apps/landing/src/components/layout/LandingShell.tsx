import { Box, Container } from '@mantine/core';
import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { LandingRouteFallback } from '../LandingRouteFallback';
import { ScrollToTop } from '../ScrollToTop';
import { Footer } from './Footer';
import { Navbar } from './Navbar';

export function LandingShell() {
  return (
    <Box mih="100vh" bg="dark.9">
      <ScrollToTop />
      <Navbar />
      <Container size="lg" py="xl" component="main">
        <Suspense fallback={<LandingRouteFallback />}>
          <Outlet />
        </Suspense>
      </Container>
      <Footer />
    </Box>
  );
}
