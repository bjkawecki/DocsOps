import { Stack, Text, Title } from '@mantine/core';

export type LandingSectionTitleCopy = {
  before: string;
  accent?: string;
  after?: string;
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function renderIntroWithHighlights(text: string, highlights: readonly string[]) {
  if (highlights.length === 0) {
    return text;
  }

  const terms = [...highlights].sort((a, b) => b.length - a.length);
  const pattern = new RegExp(`(${terms.map(escapeRegExp).join('|')})`, 'g');
  const parts = text.split(pattern);

  return parts.map((part, index) => {
    if (terms.includes(part)) {
      return (
        <Text key={`${part}-${index}`} span className="landing-section-intro-term">
          {part}
        </Text>
      );
    }

    return part;
  });
}

type LandingSectionHeaderProps = {
  title: LandingSectionTitleCopy;
  intro: string;
  introHighlights?: readonly string[];
};

export function LandingSectionHeader({
  title,
  intro,
  introHighlights = [],
}: LandingSectionHeaderProps) {
  return (
    <Stack gap="sm" maw={720} mx="auto" w="100%" align="center" className="landing-section-header">
      <Title order={2} className="landing-section-title" mb={0} ta="center">
        {title.before}
        {title.accent ? (
          <Text span inherit className="landing-section-title-accent">
            {title.accent}
          </Text>
        ) : null}
        {title.after}
      </Title>
      <Text c="gray.3" ta="center" lh={1.65} size="lg" className="landing-section-intro">
        {renderIntroWithHighlights(intro, introHighlights)}
      </Text>
    </Stack>
  );
}
