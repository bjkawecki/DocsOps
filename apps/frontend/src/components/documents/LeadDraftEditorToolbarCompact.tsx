import { ActionIcon, Menu, NativeSelect, Tooltip } from '@mantine/core';
import type { Editor } from '@tiptap/core';
import {
  IconAlertTriangle,
  IconArrowBackUp,
  IconArrowForwardUp,
  IconBold,
  IconChartDots3,
  IconCode,
  IconColumnInsertRight,
  IconFileCode,
  IconItalic,
  IconList,
  IconListNumbers,
  IconMinus,
  IconPhoto,
  IconPlus,
  IconQuote,
  IconRowInsertBottom,
  IconTable,
  IconTableOff,
  IconTypography,
} from '@tabler/icons-react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  authorSelectionAllowsInlineFormat,
  toggleAuthorInlineMark,
} from '../../tiptap/authorFormatGuards.js';
import { insertImageFromFile } from '../../lib/uploadDocumentImage.js';
import { CODE_LANGUAGE_OPTIONS, normalizeCodeLanguage } from '../../lib/normalizeCodeLanguage.js';
import {
  CALLOUT_VARIANT_OPTIONS,
  isCalloutVariant,
  type CalloutVariant,
} from '../../lib/calloutVariant.js';
import { DEFAULT_MERMAID_SOURCE } from '../../tiptap/documentMermaid.js';
import { LeadDraftLinkPopover } from './LeadDraftLinkPopover.js';
import { HeadingTool, ICON_SIZE, ToolIcon } from './LeadDraftEditorToolbarShared.js';
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
  const { t } = useTranslation('documents');
  const inlineDisabled = authorMode && !authorSelectionAllowsInlineFormat(editor, authorId);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const authorInlineDisabledReason = t('editorToolbar.inlineFormatDisabled');

  const linkControl = (
    <LeadDraftLinkPopover
      editor={editor}
      authorMode={authorMode}
      disabled={inlineDisabled}
      disabledReason={inlineDisabled ? authorInlineDisabledReason : undefined}
      active={editor.isActive('link')}
    />
  );

  const imageInput = (
    <input
      ref={imageInputRef}
      type="file"
      accept="image/jpeg,image/png,image/gif,image/webp"
      hidden
      onChange={(e) => {
        const file = e.currentTarget.files?.[0];
        e.currentTarget.value = '';
        if (!file || !documentId) return;
        void insertImageFromFile(editor, documentId, file);
      }}
    />
  );

  const calloutVariantSelect = editor.isActive('callout') ? (
    <NativeSelect
      size="xs"
      aria-label={t('editorToolbar.calloutVariantAria')}
      w={110}
      data={[...CALLOUT_VARIANT_OPTIONS]}
      value={(() => {
        const attrs = editor.getAttributes('callout') as { variant?: unknown };
        return isCalloutVariant(attrs.variant) ? attrs.variant : 'info';
      })()}
      onChange={(e) => {
        const next = e.currentTarget.value as CalloutVariant;
        if (!isCalloutVariant(next)) return;
        editor.chain().focus().updateCalloutVariant(next).run();
      }}
    />
  ) : null;

  const codeLanguageSelect = editor.isActive('codeBlock') ? (
    <NativeSelect
      size="xs"
      aria-label={t('editorToolbar.codeLanguageAria')}
      w={130}
      data={CODE_LANGUAGE_OPTIONS.map((o) => ({
        value: o.value,
        label: o.label,
      }))}
      value={(() => {
        const attrs = editor.getAttributes('codeBlock') as { language?: unknown };
        const lang = typeof attrs.language === 'string' ? attrs.language : '';
        const normalized = normalizeCodeLanguage(lang);
        if (!lang.trim()) return '';
        if (normalized === 'plaintext') return '';
        return CODE_LANGUAGE_OPTIONS.some((o) => o.value === normalized) ? normalized : '';
      })()}
      onChange={(e) => {
        const next = e.currentTarget.value;
        editor
          .chain()
          .focus()
          .updateAttributes('codeBlock', {
            language: next.length > 0 ? next : null,
          })
          .run();
      }}
    />
  ) : null;

  return (
    <div className={`${classes.row} ${classes.rowCompact}`}>
      <div className={classes.clusterTools}>
        <ToolIcon
          label={t('editorToolbar.undo')}
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <IconArrowBackUp size={ICON_SIZE} stroke={1.75} />
        </ToolIcon>
        <ToolIcon
          label={t('editorToolbar.redo')}
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <IconArrowForwardUp size={ICON_SIZE} stroke={1.75} />
        </ToolIcon>
        <HeadingTool
          label="H2"
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        />
        <HeadingTool
          label="H3"
          active={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        />
        <ToolIcon
          label={t('editorToolbar.paragraph')}
          active={editor.isActive('paragraph')}
          onClick={() => editor.chain().focus().setParagraph().run()}
        >
          <IconTypography size={ICON_SIZE} stroke={1.75} />
        </ToolIcon>
        <ToolIcon
          label={t('editorToolbar.bold')}
          active={editor.isActive('bold')}
          disabled={inlineDisabled}
          disabledReason={authorInlineDisabledReason}
          onClick={() => {
            if (authorMode) toggleAuthorInlineMark(editor, 'bold');
            else editor.chain().focus().toggleBold().run();
          }}
        >
          <IconBold size={ICON_SIZE} stroke={1.75} />
        </ToolIcon>
        <ToolIcon
          label={t('editorToolbar.italic')}
          active={editor.isActive('italic')}
          disabled={inlineDisabled}
          disabledReason={authorInlineDisabledReason}
          onClick={() => {
            if (authorMode) toggleAuthorInlineMark(editor, 'italic');
            else editor.chain().focus().toggleItalic().run();
          }}
        >
          <IconItalic size={ICON_SIZE} stroke={1.75} />
        </ToolIcon>
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
                    <ActionIcon size={28} variant="light" aria-label={t('editorToolbar.moreTools')}>
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
        {authorMode && (
          <ToolIcon
            label={t('editorToolbar.inlineCode')}
            active={editor.isActive('code')}
            disabled={inlineDisabled}
            disabledReason={authorInlineDisabledReason}
            onClick={() => toggleAuthorInlineMark(editor, 'code')}
          >
            <IconCode size={ICON_SIZE} stroke={1.75} />
          </ToolIcon>
        )}
      </div>
    </div>
  );
}
