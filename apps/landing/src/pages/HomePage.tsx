import { Stack } from '@mantine/core';
import { HeroSection } from '../components/sections/HeroSection';
import { ScopeSection } from '../components/sections/ScopeSection';
import { ContextSection } from '../components/sections/ContextSection';
import { RolesPublicationSection } from '../components/sections/RolesPublicationSection';
import { ExampleSection } from '../components/sections/ExampleSection';

export function HomePage() {
  return (
    <Stack gap={0}>
      <HeroSection />
      <ScopeSection />
      <ContextSection />
      <RolesPublicationSection />
      <ExampleSection />
    </Stack>
  );
}
