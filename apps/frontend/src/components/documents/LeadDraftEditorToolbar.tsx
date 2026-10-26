import { Box, Text } from '@mantine/core';
import type { Editor } from '@tiptap/core';
import {
  IconAlertTriangle,
  IconChartDots3,
  IconFileCode,
  IconList,
  IconListNumbers,
  IconMinus,
  IconPhoto,
  IconQuote,
  IconTable,
} from '@tabler/icons-react';
import type { ReactNode } from 'react';
import { DEFAULT_MERMAID_SOURCE } from '../../tiptap/documentMermaid.js';
import { LeadDraftEditorToolbarCompact } from './LeadDraftEditorToolbarCompact.js';
import { ICON_SIZE, ToolIcon } from './LeadDraftEditorToolbarShared.js';
import { useLeadDraftToolbarControls } from './useLeadDraftToolbarControls.js';
import classes from './LeadDraftEditorToolbar.module.css';
import { useWideLayout } from '../appShell/useWideLayout.js';

type Props = {
  editor: Editor;
  authorMode: boolean;
  authorId?: string;
  documentId: string;
};

function ToolCluster({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box className={classes.cluster}>
      <Text className={classes.clusterTitle}>{title}</Text>
      <div className={classes.clusterTools}>{children}</div>
    </Box>
  );
}

function LeadDraftEditorToolbarWide({ editor, authorMode, authorId = '', documentId }: Props) {
  const {
    t,
    imageInputRef,
    imageInput,
    calloutVariantSelect,
    codeLanguageSelect,
    undoRedoTools,
    blockTypeTools,
    boldTool,
    italicTool,
    codeTool,
    linkControl,
    tableExtras,
  } = useLeadDraftToolbarControls({ editor, authorMode, authorId, documentId });

  return (
    <div className={classes.row}>
      <ToolCluster title={t('editorToolbar.editCluster')}>{undoRedoTools}</ToolCluster>

      <ToolCluster title={t('editorToolbar.blockCluster')}>{blockTypeTools}</ToolCluster>

      {!authorMode && (
        <ToolCluster title={t('editorToolbar.insertCluster')}>
          <ToolIcon
            label={t('editorToolbar.bulletList')}
            active={editor.isActive('bulletList')}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <IconList size={ICON_SIZE} stroke={1.75} />
          </ToolIcon>
          <ToolIcon
            label={t('editorToolbar.numberedList')}
            active={editor.isActive('orderedList')}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <IconListNumbers size={ICON_SIZE} stroke={1.75} />
          </ToolIcon>
          <ToolIcon
            label={t('editorToolbar.quote')}
            active={editor.isActive('blockquote')}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            <IconQuote size={ICON_SIZE} stroke={1.75} />
          </ToolIcon>
          <ToolIcon
            label={t('editorToolbar.callout')}
            active={editor.isActive('callout')}
            onClick={() => editor.chain().focus().toggleCallout({ variant: 'info' }).run()}
          >
            <IconAlertTriangle size={ICON_SIZE} stroke={1.75} />
          </ToolIcon>
          {calloutVariantSelect}
          <ToolIcon
            label={t('editorToolbar.divider')}
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
          >
            <IconMinus size={ICON_SIZE} stroke={1.75} />
          </ToolIcon>
          <ToolIcon
            label={t('editorToolbar.codeBlock')}
            active={editor.isActive('codeBlock')}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          >
            <IconFileCode size={ICON_SIZE} stroke={1.75} />
          </ToolIcon>
          {codeLanguageSelect}
          <ToolIcon
            label={t('editorToolbar.mermaidDiagram')}
            active={editor.isActive('mermaid')}
            onClick={() => editor.chain().focus().insertMermaid(DEFAULT_MERMAID_SOURCE).run()}
          >
            <IconChartDots3 size={ICON_SIZE} stroke={1.75} />
          </ToolIcon>
          <ToolIcon
            label={t('editorToolbar.image')}
            active={editor.isActive('image')}
            onClick={() => imageInputRef.current?.click()}
          >
            <IconPhoto size={ICON_SIZE} stroke={1.75} />
          </ToolIcon>
          {imageInput}
          <ToolIcon
            label={t('editorToolbar.table')}
            active={editor.isActive('table')}
            onClick={() =>
              editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
            }
          >
            <IconTable size={ICON_SIZE} stroke={1.75} />
          </ToolIcon>
          {tableExtras}
        </ToolCluster>
      )}

      <ToolCluster title={t('editorToolbar.formatCluster')}>
        {boldTool}
        {italicTool}
        {codeTool}
        {linkControl}
      </ToolCluster>
    </div>
  );
}

export function LeadDraftEditorToolbar(props: Props) {
  const isWide = useWideLayout();
  if (!isWide) return <LeadDraftEditorToolbarCompact {...props} />;
  return <LeadDraftEditorToolbarWide {...props} />;
}
