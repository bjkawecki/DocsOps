import { Box, Table, Text, Title } from '@mantine/core';
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

/** Spaltenreihenfolge: Gegner zuerst, eigenes Produkt rechts. */
export function ComparisonSection({ showTitle = true }: Props) {
  return (
    <Box id="comparison" className="landing-section" component="section">
      {showTitle ? (
        <Title order={2} className="landing-section-title">
          {comparisonCopy.title}
        </Title>
      ) : null}

      <Box style={{ overflowX: 'auto' }}>
        <Table className="landing-comparison-table" layout="fixed">
          <Table.Thead>
            <Table.Tr>
              <Table.Th w="50%">{comparisonCopy.columnCriterion}</Table.Th>
              <Table.Th w="25%">Confluence</Table.Th>
              <Table.Th w="25%">DocsOps</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {comparisonRows.map((row) => (
              <Table.Tr key={row.label}>
                <Table.Td>
                  <Box>
                    <Text className="landing-comparison-feature">{row.label}</Text>
                    {row.detail ? (
                      <Text className="landing-comparison-detail">{row.detail}</Text>
                    ) : null}
                  </Box>
                </Table.Td>
                <Table.Td>
                  <ComparisonCell value={row.confluence} note={row.confluenceNote} />
                </Table.Td>
                <Table.Td>
                  <ComparisonCell value={row.docsops} note={row.docsopsNote} />
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Box>
    </Box>
  );
}
