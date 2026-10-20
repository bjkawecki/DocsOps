import { List, Stack, Table, Text, Title } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation } from 'react-router-dom';
import { findHelpTopic, HELP_DEFAULT_PATH } from './helpTopics.js';

function stringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

type HelpArticleTable = {
  headers: string[];
  rows: string[][];
};

type HelpArticleSubsection = {
  heading: string;
  paragraphs: string[];
};

type HelpArticleSection = {
  heading: string;
  paragraphs: string[];
  subsections: HelpArticleSubsection[];
  table: HelpArticleTable | null;
};

function articleTable(value: unknown): HelpArticleTable | null {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const headers = stringList(record.headers);
  if (headers.length === 0 || !Array.isArray(record.rows)) return null;
  const rows: string[][] = [];
  for (const row of record.rows) {
    const cells = stringList(row);
    if (cells.length === 0) continue;
    rows.push(cells);
  }
  if (rows.length === 0) return null;
  return { headers, rows };
}

function articleSubsections(value: unknown): HelpArticleSubsection[] {
  if (!Array.isArray(value)) return [];
  const subsections: HelpArticleSubsection[] = [];
  for (const item of value) {
    if (item == null || typeof item !== 'object') continue;
    const record = item as Record<string, unknown>;
    const heading = typeof record.heading === 'string' ? record.heading : '';
    const paragraphs = stringList(record.paragraphs);
    if (heading === '' || paragraphs.length === 0) continue;
    subsections.push({ heading, paragraphs });
  }
  return subsections;
}

function articleSections(value: unknown): HelpArticleSection[] {
  if (!Array.isArray(value)) return [];
  const sections: HelpArticleSection[] = [];
  for (const item of value) {
    if (item == null || typeof item !== 'object') continue;
    const record = item as Record<string, unknown>;
    const heading = typeof record.heading === 'string' ? record.heading : '';
    const paragraphs = stringList(record.paragraphs);
    const subsections = articleSubsections(record.subsections);
    const table = articleTable(record.table);
    if (heading === '' || (paragraphs.length === 0 && subsections.length === 0 && table == null)) {
      continue;
    }
    sections.push({ heading, paragraphs, subsections, table });
  }
  return sections;
}

/**
 * Help article page: finished prose when `lead` or `sections` exist, otherwise stub outline.
 * No cross-article links in body copy.
 */
export function HelpArticlePage() {
  const { t, i18n } = useTranslation('help');
  const { pathname } = useLocation();
  const topic = findHelpTopic(pathname);
  if (topic == null) {
    return <Navigate to={HELP_DEFAULT_PATH} replace />;
  }

  const articleKey = `articles.${topic.id}`;
  const lead = i18n.exists(`${articleKey}.lead`, { ns: 'help' })
    ? stringList(t(`${articleKey}.lead`, { returnObjects: true }))
    : [];
  const sections = i18n.exists(`${articleKey}.sections`, { ns: 'help' })
    ? articleSections(t(`${articleKey}.sections`, { returnObjects: true }))
    : [];
  const hasProse = lead.length > 0 || sections.length > 0;

  if (hasProse) {
    const closing = i18n.exists(`${articleKey}.closing`, { ns: 'help' })
      ? stringList(t(`${articleKey}.closing`, { returnObjects: true }))
      : [];

    return (
      <Stack gap="md" align="stretch" style={{ textAlign: 'left' }}>
        <Title order={1}>{t(`topics.${topic.id}`)}</Title>
        {lead.map((paragraph) => (
          <Text key={paragraph} component="p" m={0}>
            {paragraph}
          </Text>
        ))}
        {sections.map((section) => (
          <Stack key={section.heading} gap="sm">
            <Title order={2}>{section.heading}</Title>
            {section.paragraphs.map((paragraph) => (
              <Text key={paragraph} component="p" m={0}>
                {paragraph}
              </Text>
            ))}
            {section.subsections.map((subsection) => (
              <Stack key={subsection.heading} gap="sm">
                <Title order={3}>{subsection.heading}</Title>
                {subsection.paragraphs.map((paragraph) => (
                  <Text key={paragraph} component="p" m={0}>
                    {paragraph}
                  </Text>
                ))}
              </Stack>
            ))}
            {section.table != null ? (
              <Table.ScrollContainer minWidth={480}>
                <Table withTableBorder withColumnBorders striped>
                  <Table.Thead>
                    <Table.Tr>
                      {section.table.headers.map((header) => (
                        <Table.Th key={header}>{header}</Table.Th>
                      ))}
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {section.table.rows.map((row) => (
                      <Table.Tr key={row.join('|')}>
                        {row.map((cell, index) => (
                          <Table.Td key={`${row[0]}-${index}`}>{cell}</Table.Td>
                        ))}
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            ) : null}
          </Stack>
        ))}
        {closing.map((paragraph) => (
          <Text key={paragraph} component="p" m={0}>
            {paragraph}
          </Text>
        ))}
      </Stack>
    );
  }

  const outlineItems = stringList(t(`${articleKey}.outline`, { returnObjects: true }));
  const hasCustomize = i18n.exists(`${articleKey}.customizeHeading`, { ns: 'help' });
  const customizeItems = hasCustomize
    ? stringList(t(`${articleKey}.customizeOutline`, { returnObjects: true }))
    : [];

  return (
    <Stack gap="md" align="stretch" style={{ textAlign: 'left' }}>
      <Title order={1}>{t(`topics.${topic.id}`)}</Title>

      <Stack gap="xs">
        <Text size="sm" c="dimmed" fw={600}>
          {t('stub.internalQuestion')}
        </Text>
        <Text component="p" m={0}>
          {t(`${articleKey}.internalQuestion`)}
        </Text>
      </Stack>

      <Stack gap="xs">
        <Text size="sm" c="dimmed" fw={600}>
          {t('stub.outline')}
        </Text>
        <List spacing="xs">
          {outlineItems.map((item) => (
            <List.Item key={item}>{item}</List.Item>
          ))}
        </List>
      </Stack>

      {hasCustomize ? (
        <Stack gap="xs">
          <Title order={2}>{t(`${articleKey}.customizeHeading`)}</Title>
          <List spacing="xs">
            {customizeItems.map((item) => (
              <List.Item key={item}>{item}</List.Item>
            ))}
          </List>
        </Stack>
      ) : null}
    </Stack>
  );
}
