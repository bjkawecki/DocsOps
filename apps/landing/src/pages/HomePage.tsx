import { Stack } from '@mantine/core';
import { ContextSection } from '../components/sections/ContextSection';
import { ExampleSection } from '../components/sections/ExampleSection';
import { FinalCtaSection } from '../components/sections/FinalCtaSection';
import { HeroSection } from '../components/sections/HeroSection';
import { PhilosophyTeaserSection } from '../components/sections/PhilosophyTeaserSection';
import { RolesPublicationSection } from '../components/sections/RolesPublicationSection';
import { ScopeSection } from '../components/sections/ScopeSection';

export function HomePage() {
  return (
    <Stack gap={0}>
      <HeroSection />
      <ScopeSection />
      <ContextSection />
      <RolesPublicationSection />
      <ExampleSection />
      <PhilosophyTeaserSection />
      <FinalCtaSection />
    </Stack>
  );
}
