import { Accordion, Box, Title } from '@mantine/core';
import { faqItems } from '../../content/faq';
import { faqCopy } from '../../content/siteCopy';

export function FaqSection() {
  return (
    <Box id="faq" className="landing-section landing-faq">
      <Title order={2} className="landing-section-title">
        {faqCopy.title}
      </Title>

      <Accordion
        variant="separated"
        radius="md"
        chevronPosition="right"
        maw={760}
        mx="auto"
        styles={{
          item: {
            backgroundColor: 'var(--mantine-color-dark-8)',
            border: '1px solid var(--mantine-color-dark-5)',
          },
          control: {
            backgroundColor: 'transparent',
          },
          panel: {
            color: 'var(--mantine-color-dimmed)',
          },
        }}
      >
        {faqItems.map((item) => (
          <Accordion.Item key={item.question} value={item.question}>
            <Accordion.Control>{item.question}</Accordion.Control>
            <Accordion.Panel>{item.answer}</Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>
    </Box>
  );
}
