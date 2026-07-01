import { Box, SimpleGrid, Text, Title } from '@mantine/core';
import { features } from '../../content/features';
import { featuresSectionCopy } from '../../content/siteCopy';

export function FeaturesSection() {
  return (
    <Box id="features" className="landing-section">
      <Title order={2} className="landing-section-title">
        {featuresSectionCopy.title}
      </Title>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing={{ base: 'xl', md: 40 }}>
        {features.map((feature) => (
          <Box key={feature.title} className="landing-feature-item">
            <Box className="landing-feature-heading">
              <feature.icon size={22} stroke={1.7} className="landing-feature-icon" />
              <Text fw={700} fz="lg">
                {feature.title}
              </Text>
            </Box>
            <Text c="dimmed" size="sm" lh={1.65}>
              {feature.description}
            </Text>
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  );
}
