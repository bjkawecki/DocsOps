import { Box, Stack, Table, Text, Title, Tooltip } from '@mantine/core';
import { ComparisonSymbol } from '../ComparisonSymbol';
import { comparisonRows } from '../../content/comparison';
import { comparisonCopy } from '../../content/siteCopy';

function ComparisonCell({ value, note }: { value: 'yes' | 'no' | 'partial'; note?: string }) {
  return <ComparisonSymbol value={value} note={note} />;
}

type Props = {
  /** When false, omit the page H2 (hub page already has a title). */
  showTitle?: boolean;
};

export function ComparisonSection({ showTitle = true }: Props) {
  return (
    <Box id="comparison" className="landing-section" component="section">
      {showTitle ? (
        <Title order={2} className="landing-section-title">
          {comparisonCopy.title}
        </Title>
      ) : null}

      <Text c="dimmed" size="md" maw={720} mb="lg">
        {comparisonCopy.subline}
      </Text>

      <Box style={{ overflowX: 'auto' }}>
        <Table className="landing-comparison-table" layout="fixed">
          <Table.Thead>
            <Table.Tr>
              <Table.Th w="44%">{comparisonCopy.columnCriterion}</Table.Th>
              <Table.Th w="18%">DocsOps</Table.Th>
              <Table.Th w="19%">Confluence</Table.Th>
              <Table.Th w="19%">Docmost</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {comparisonRows.map((row) => {
              const label = (
                <Box>
                  <Text className="landing-comparison-feature">{row.label}</Text>
                  {row.detail ? (
                    <Text className="landing-comparison-detail">{row.detail}</Text>
                  ) : null}
                </Box>
              );

              return (
                <Table.Tr key={row.label}>
                  <Table.Td>
                    {row.tooltip ? (
                      <Tooltip label={row.tooltip} multiline w={280} withArrow>
                        <Box>{label}</Box>
                      </Tooltip>
                    ) : (
                      label
                    )}
                  </Table.Td>
                  <Table.Td>
                    <ComparisonCell value={row.docsops} note={row.docsopsNote} />
                  </Table.Td>
                  <Table.Td>
                    <ComparisonCell value={row.confluence} note={row.confluenceNote} />
                  </Table.Td>
                  <Table.Td>
                    <ComparisonCell value={row.docmost} />
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </Box>

      <Stack gap="sm" mt="lg">
        <Text size="sm" c="dimmed">
          {comparisonCopy.footnote}
        </Text>
      </Stack>
    </Box>
  );
}
