import { Box, SimpleGrid, Text, Title } from '@mantine/core';
import { useLandingCopy } from '../../content/useLandingCopy';

export function FeaturesSection() {
  const { features: featuresMod, site } = useLandingCopy();
  const { features } = featuresMod;
  const { featuresSectionCopy } = site;

  return (
    <Box id="features" className="landing-section">
      <Box className="landing-features" maw={880} mx="auto" w="100%">
        <Title order={2} className="landing-section-title">
          {featuresSectionCopy.title}
        </Title>

        <SimpleGrid
          cols={{ base: 1, sm: 2 }}
          spacing={{ base: 'xl', md: 72 }}
          verticalSpacing={{ base: 40, md: 56 }}
        >
          {features.map((feature) => (
            <Box key={feature.title} className="landing-feature-item">
              <Box className="landing-feature-heading">
                <feature.icon size={24} stroke={1.6} className="landing-feature-icon" />
                <Text className="landing-feature-title">{feature.title}</Text>
              </Box>
              <Text className="landing-feature-body" lh={1.65}>
                {feature.description}
              </Text>
            </Box>
          ))}
        </SimpleGrid>
      </Box>
    </Box>
  );
}
