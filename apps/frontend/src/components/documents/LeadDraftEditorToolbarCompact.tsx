import { ActionIcon, Menu, Tooltip } from '@mantine/core';
import type { Editor } from '@tiptap/core';
import {
  IconAlertTriangle,
  IconChartDots3,
  IconChevronDown,
  IconChevronUp,
  IconColumnInsertRight,
  IconFileCode,
  IconList,
  IconListNumbers,
  IconMinus,
  IconPhoto,
  IconPlus,
  IconQuote,
  IconRowInsertBottom,
  IconTable,
  IconTableOff,
} from '@tabler/icons-react';
import { useState } from 'react';
import { DEFAULT_MERMAID_SOURCE } from '../../tiptap/documentMermaid.js';
import { ICON_SIZE, ToolIcon } from './LeadDraftEditorToolbarShared.js';
import { useLeadDraftToolbarControls } from './useLeadDraftToolbarControls.js';
import classes from './LeadDraftEditorToolbar.module.css';

type Props = {
  editor: Editor;
  authorMode: boolean;
  authorId?: string;
  documentId: string;
};

export function LeadDraftEditorToolbarCompact({
  editor,
  authorMode,
  authorId = '',
  documentId,
}: Props) {
  const [expanded, setExpanded] = useState(false);
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
  } = useLeadDraftToolbarControls({ editor, authorMode, authorId, documentId });

  if (!expanded) {
    return (
      <div className={`${classes.row} ${classes.rowCompact} ${classes.rowCompactCollapsed}`}>
        <button
          type="button"
          className={classes.collapseToggle}
          aria-expanded={false}
          aria-label={t('editorToolbar.expandToolbar')}
          onClick={() => setExpanded(true)}
        >
          <span className={classes.collapseToggleLabel}>
            {t('editorToolbar.toolbarCollapsedLabel')}
          </span>
          <IconChevronDown size={18} stroke={1.75} aria-hidden />
        </button>
      </div>
    );
  }

  return (
    <div className={`${classes.row} ${classes.rowCompact}`}>
      <div className={classes.clusterTools}>
        <ToolIcon label={t('editorToolbar.collapseToolbar')} onClick={() => setExpanded(false)}>
          <IconChevronUp size={ICON_SIZE} stroke={1.75} />
        </ToolIcon>
        {undoRedoTools}
        {blockTypeTools}
        {boldTool}
        {italicTool}
        {linkControl}
        {!authorMode && (
          <>
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
            <Menu shadow="md" position="bottom-end" withinPortal>
              <Menu.Target>
                <Tooltip label={t('editorToolbar.moreTools')} withArrow>
                  <span className={classes.toolHit}>
                    <ActionIcon
                      size={28}
                      variant="subtle"
                      color="gray"
                      aria-label={t('editorToolbar.moreTools')}
                    >
                      <IconPlus size={ICON_SIZE} stroke={1.75} />
                    </ActionIcon>
                  </span>
                </Tooltip>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item
                  leftSection={<IconQuote size={14} />}
                  onClick={() => editor.chain().focus().toggleBlockquote().run()}
                >
                  {t('editorToolbar.quote')}
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconAlertTriangle size={14} />}
                  onClick={() => editor.chain().focus().toggleCallout({ variant: 'info' }).run()}
                >
                  {t('editorToolbar.callout')}
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconMinus size={14} />}
                  onClick={() => editor.chain().focus().setHorizontalRule().run()}
                >
                  {t('editorToolbar.divider')}
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconFileCode size={14} />}
                  onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                >
                  {t('editorToolbar.codeBlock')}
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconChartDots3 size={14} />}
                  onClick={() => editor.chain().focus().insertMermaid(DEFAULT_MERMAID_SOURCE).run()}
                >
                  {t('editorToolbar.mermaidDiagram')}
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconPhoto size={14} />}
                  onClick={() => imageInputRef.current?.click()}
                >
                  {t('editorToolbar.image')}
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconTable size={14} />}
                  onClick={() =>
                    editor
                      .chain()
                      .focus()
                      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                      .run()
                  }
                >
                  {t('editorToolbar.table')}
                </Menu.Item>
                {editor.isActive('table') && (
                  <>
                    <Menu.Divider />
                    <Menu.Item
                      leftSection={<IconRowInsertBottom size={14} />}
                      onClick={() => editor.chain().focus().addRowAfter().run()}
                    >
                      {t('editorToolbar.addRow')}
                    </Menu.Item>
                    <Menu.Item
                      leftSection={<IconColumnInsertRight size={14} />}
                      onClick={() => editor.chain().focus().addColumnAfter().run()}
                    >
                      {t('editorToolbar.addColumn')}
                    </Menu.Item>
                    <Menu.Item
                      leftSection={<IconTableOff size={14} />}
                      onClick={() => editor.chain().focus().deleteTable().run()}
                    >
                      {t('editorToolbar.deleteTable')}
                    </Menu.Item>
                  </>
                )}
              </Menu.Dropdown>
            </Menu>
            {calloutVariantSelect}
            {codeLanguageSelect}
            {imageInput}
          </>
        )}
        {authorMode && codeTool}
      </div>
    </div>
  );
}
