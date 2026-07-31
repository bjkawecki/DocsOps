import { Box, List, Stack, Table, Text, Title } from '@mantine/core';
import { Fragment, type ReactNode } from 'react';
import type { BlockDocument, BlockNodeV0 } from '../../api/document-types';
import { ensureUniqueBlockIdsInDocument } from '../../lib/blockDocumentTiptap';
import { documentAttachmentUrl, formatFigureCaption } from '../../lib/figureCaption.js';
import { CODE_LANGUAGE_OPTIONS, normalizeCodeLanguage } from '../../lib/normalizeCodeLanguage.js';
import {
  getBlockDocumentHeadingData,
  nodeText,
} from '../../pages/documentPage/blockDocumentHeadings';
import { renderInlineBlockContent } from './documentBlockPreviewInline.js';
import { DocumentPreviewCodeBlock } from './DocumentPreviewCodeBlock';
import { DocumentPreviewMermaid } from './DocumentPreviewMermaid';
import calloutClasses from './DocumentCallout.module.css';
import { CALLOUT_VARIANT_LABELS } from '../../lib/calloutVariant.js';

/** Label shown in the code block header (inside the chrome), or null if none. */
function codeBlockLanguageLabel(rawLang: string, normalized: string): string | null {
  const trimmed = rawLang.trim();
  if (!trimmed) return null;
  const fromOptions = CODE_LANGUAGE_OPTIONS.find((o) => o.value === normalized);
  if (fromOptions && fromOptions.value !== '') return fromOptions.label;
  return trimmed;
}

type PreviewCtx = {
  anchorMap: ReadonlyMap<string, string>;
  figureNumberByBlockId: ReadonlyMap<string, number>;
  documentId: string;
};

function buildFigureNumberByBlockId(doc: BlockDocument): Map<string, number> {
  const map = new Map<string, number>();
  let n = 0;
  for (const block of doc.blocks) {
    if (block.type !== 'image') continue;
    n += 1;
    map.set(block.id, n);
  }
  return map;
}

function walkNode(node: BlockNodeV0): string {
  if (node.type === 'text') {
    const t = node.meta?.text;
    return typeof t === 'string' ? t : '';
  }
  if (!node.content?.length) return '';
  const sep = node.type === 'paragraph' || node.type === 'heading' ? ' ' : '\n';
  return node.content
    .map(walkNode)
    .filter((s) => s.length > 0)
    .join(sep);
}

function headingOrder(attrs: Record<string, unknown> | undefined): 1 | 2 | 3 | 4 | 5 | 6 {
  const raw = attrs?.level;
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    const n = Math.trunc(raw);
    if (n >= 1 && n <= 6) return n as 1 | 2 | 3 | 4 | 5 | 6;
  }
  return 2;
}

function renderNode(node: BlockNodeV0, ctx: PreviewCtx): ReactNode {
  switch (node.type) {
    case 'heading': {
      const anchorId = ctx.anchorMap.get(node.id);
      const order = headingOrder(node.attrs);
      const inline = renderInlineBlockContent(node.content);
      const fallback = nodeText(node).trim();
      if (!inline && !fallback) {
        return (
          <Title order={order} id={anchorId}>
            (Untitled)
          </Title>
        );
      }
      return (
        <Title order={order} id={anchorId}>
          {inline ?? fallback}
        </Title>
      );
    }
    case 'paragraph': {
      const inline = renderInlineBlockContent(node.content);
      if (inline) {
        return (
          <Text
            size="lg"
            c="var(--mantine-color-text)"
            component="p"
            style={{ whiteSpace: 'pre-wrap' }}
          >
            {inline}
          </Text>
        );
      }
      const t = walkNode(node);
      if (!t.trim()) return null;
      return (
        <Text
          size="lg"
          c="var(--mantine-color-text)"
          component="p"
          style={{ whiteSpace: 'pre-wrap' }}
        >
          {t}
        </Text>
      );
    }
    case 'bullet_list': {
      const items = node.content ?? [];
      if (items.length === 0) return null;
      return (
        <List type="unordered" size="lg" spacing="xs" withPadding>
          {items.map((item) => (
            <List.Item key={item.id}>{renderNode(item, ctx)}</List.Item>
          ))}
        </List>
      );
    }
    case 'ordered_list': {
      const items = node.content ?? [];
      if (items.length === 0) return null;
      return (
        <List type="ordered" size="lg" spacing="xs" withPadding>
          {items.map((item) => (
            <List.Item key={item.id}>{renderNode(item, ctx)}</List.Item>
          ))}
        </List>
      );
    }
    case 'blockquote': {
      const parts = node.content ?? [];
      if (parts.length === 0) return null;
      return (
        <Box
          component="blockquote"
          pl="md"
          style={{
            borderInlineStart:
              '3px solid light-dark(var(--mantine-color-gray-4), var(--mantine-color-dark-3))',
            margin: 0,
          }}
        >
          <Stack gap="sm">
            {parts.map((c) => (
              <Fragment key={c.id}>{renderNode(c, ctx)}</Fragment>
            ))}
          </Stack>
        </Box>
      );
    }
    case 'callout': {
      const parts = node.content ?? [];
      if (parts.length === 0) return null;
      const rawVariant = node.attrs?.variant;
      const variant =
        rawVariant === 'warning' || rawVariant === 'tip' || rawVariant === 'info'
          ? rawVariant
          : 'info';
      return (
        <aside className={calloutClasses.root} data-callout="" data-variant={variant}>
          <div className={calloutClasses.label}>{CALLOUT_VARIANT_LABELS[variant]}</div>
          <div className={calloutClasses.content}>
            <Stack gap="sm">
              {parts.map((c) => (
                <Fragment key={c.id}>{renderNode(c, ctx)}</Fragment>
              ))}
            </Stack>
          </div>
        </aside>
      );
    }
    case 'horizontal_rule':
      return (
        <Box
          component="hr"
          my="md"
          style={{
            border: 'none',
            borderTop:
              '1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))',
          }}
        />
      );
    case 'image': {
      const attachmentId =
        typeof node.attrs?.attachmentId === 'string' ? node.attrs.attachmentId : '';
      if (!attachmentId || !ctx.documentId) return null;
      const caption = typeof node.attrs?.caption === 'string' ? node.attrs.caption : '';
      const alt = typeof node.attrs?.alt === 'string' ? node.attrs.alt : '';
      const figureN = ctx.figureNumberByBlockId.get(node.id) ?? 1;
      const label = formatFigureCaption(figureN, caption);
      const src = documentAttachmentUrl(ctx.documentId, attachmentId);
      return (
        <Box component="figure" m={0} my="md">
          <Box
            component="img"
            src={src}
            alt={alt || label}
            maw="100%"
            style={{ display: 'block', height: 'auto' }}
          />
          <Text component="figcaption" size="sm" c="dimmed" mt="xs">
            {label}
          </Text>
        </Box>
      );
    }
    case 'table': {
      const rows = (node.content ?? []).filter((r) => r.type === 'table_row');
      if (rows.length === 0) return null;
      return (
        <Table withTableBorder withColumnBorders stickyHeader={false}>
          <Table.Tbody>
            {rows.map((row) => (
              <Table.Tr key={row.id}>
                {(row.content ?? [])
                  .filter((c) => c.type === 'table_cell' || c.type === 'table_header')
                  .map((cell) => {
                    const CellTag = cell.type === 'table_header' ? Table.Th : Table.Td;
                    return (
                      <CellTag key={cell.id} style={{ verticalAlign: 'top' }}>
                        <Stack gap={4}>
                          {(cell.content ?? []).map((c) => (
                            <Fragment key={c.id}>{renderNode(c, ctx)}</Fragment>
                          ))}
                        </Stack>
                      </CellTag>
                    );
                  })}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      );
    }
    case 'table_row':
    case 'table_cell':
    case 'table_header': {
      const parts = node.content ?? [];
      if (parts.length === 0) return null;
      return (
        <Stack gap={4}>
          {parts.map((c) => (
            <Fragment key={c.id}>{renderNode(c, ctx)}</Fragment>
          ))}
        </Stack>
      );
    }
    case 'list_item': {
      const parts = node.content ?? [];
      if (parts.length === 0) return null;
      return (
        <Stack gap={4}>
          {parts.map((c) => (
            <Fragment key={c.id}>{renderNode(c, ctx)}</Fragment>
          ))}
        </Stack>
      );
    }
    case 'code': {
      const body = walkNode(node);
      const rawLang = typeof node.attrs?.lang === 'string' ? node.attrs.lang : '';
      const language = normalizeCodeLanguage(rawLang);
      return (
        <DocumentPreviewCodeBlock
          code={body}
          language={language}
          label={codeBlockLanguageLabel(rawLang, language)}
        />
      );
    }
    case 'mermaid': {
      return <DocumentPreviewMermaid source={walkNode(node)} />;
    }
    case 'text': {
      const inline = renderInlineBlockContent([node]);
      if (inline) {
        return (
          <Text size="lg" component="span" style={{ whiteSpace: 'pre-wrap' }}>
            {inline}
          </Text>
        );
      }
      const t = node.meta?.text;
      return typeof t === 'string' && t.length > 0 ? (
        <Text size="lg" component="span" style={{ whiteSpace: 'pre-wrap' }}>
          {t}
        </Text>
      ) : null;
    }
    default: {
      const t = walkNode(node);
      if (!t.trim()) return null;
      return (
        <Text size="lg" c="dimmed" style={{ whiteSpace: 'pre-wrap' }}>
          {t}
        </Text>
      );
    }
  }
}

/** Fließtext aus Block-Baum (Lesevorschau ohne Markdown). */
export function blockDocumentToPlainPreview(doc: BlockDocument): string {
  return doc.blocks
    .map(walkNode)
    .filter((s) => s.length > 0)
    .join('\n\n');
}

type Props = {
  /** Optional section label above the preview; omit on the document page. */
  title?: string;
  doc: BlockDocument | null;
  documentId: string;
};

/** Lesevorschau aus Blocks – Überschriften inkl. Anker-IDs (TOC / Kommentar-Slugs). */
export function DocumentBlocksPreview({ title, doc, documentId }: Props) {
  if (doc == null || doc.blocks.length === 0) return null;
  const normalizedDoc = ensureUniqueBlockIdsInDocument(doc);
  const { anchorIdByBlockNodeId } = getBlockDocumentHeadingData(normalizedDoc);
  const ctx: PreviewCtx = {
    anchorMap: anchorIdByBlockNodeId,
    figureNumberByBlockId: buildFigureNumberByBlockId(normalizedDoc),
    documentId,
  };
  const rendered = normalizedDoc.blocks
    .map((block) => {
      const el = renderNode(block, ctx);
      if (el == null) return null;
      return <Box key={block.id}>{el}</Box>;
    })
    .filter((el) => el != null);
  if (rendered.length === 0) return null;
  return (
    <Box mb="md" className="document-content">
      {title ? (
        <Text size="xs" tt="uppercase" fw={600} c="dimmed" mb="xs">
          {title}
        </Text>
      ) : null}
      <Stack gap="md">{rendered}</Stack>
    </Box>
  );
}
