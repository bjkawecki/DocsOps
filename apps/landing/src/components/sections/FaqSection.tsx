import { useState } from 'react';
import { Accordion, Anchor, Box, Stack, Text, Title } from '@mantine/core';
import { Link } from 'react-router-dom';
import { useLandingCopy } from '../../content/useLandingCopy';
import { useLocale } from '../../i18n/LocaleProvider';
import { pathFor, type LandingSlugKey } from '../../i18n/locale';

export function FaqSection() {
  const { locale } = useLocale();
  const { faq, site } = useLandingCopy();
  const { faqItems } = faq;
  const { faqCopy } = site;
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
              backgroundColor: 'var(--landing-faq-item-bg)',
              border: '1px solid var(--landing-faq-item-border)',
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
                <Text size="md" c="dimmed" lh={1.65} className="landing-faq-answer">
                  {item.answer}
                </Text>
                {item.link ? (
                  <Anchor
                    component={Link}
                    to={pathFor(locale, item.link.to as LandingSlugKey)}
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
