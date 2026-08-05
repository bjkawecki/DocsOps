import { useState } from 'react';
import { Accordion, Anchor, Box, Stack, Text, Title } from '@mantine/core';
import { Link } from 'react-router-dom';
import { faqItems } from '../../content/faq';
import { faqCopy } from '../../content/siteCopy';

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function renderAnswerWithHighlights(text: string, highlights: readonly string[]) {
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

export function FaqSection() {
  const firstQuestion = faqItems[0]?.question ?? '';
  const [opened, setOpened] = useState<string[]>(firstQuestion ? [firstQuestion] : []);

  return (
    <Box id="faq" className="landing-section landing-faq">
      <Stack gap="xl" maw={760} mx="auto" w="100%">
        <Title order={2} className="landing-section-title" ta="center" mb={0}>
          {faqCopy.title}
        </Title>

        <Accordion
          multiple
          value={opened}
          onChange={(next) => {
            if (!firstQuestion) {
              setOpened(next);
              return;
            }
            setOpened(next.includes(firstQuestion) ? next : [firstQuestion, ...next]);
          }}
          variant="separated"
          radius="md"
          chevronPosition="right"
          className="landing-faq-accordion"
          styles={{
            item: {
              backgroundColor: 'var(--mantine-color-dark-8)',
              border: '1px solid var(--mantine-color-dark-5)',
            },
            control: {
              backgroundColor: 'transparent',
            },
          }}
        >
          {faqItems.map((item) => (
            <Accordion.Item key={item.question} value={item.question}>
              <Accordion.Control>{item.question}</Accordion.Control>
              <Accordion.Panel>
                <Text size="md" c="gray.2" lh={1.65} className="landing-faq-answer">
                  {renderAnswerWithHighlights(item.answer, item.highlights ?? [])}
                </Text>
                {item.link ? (
                  <Anchor
                    component={Link}
                    to={item.link.to}
                    mt="sm"
                    display="inline-block"
                    className="landing-faq-link"
                  >
                    {item.link.label}
                  </Anchor>
                ) : null}
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>
      </Stack>
    </Box>
  );
}
