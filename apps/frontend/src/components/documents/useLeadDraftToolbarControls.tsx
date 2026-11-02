import { NativeSelect } from '@mantine/core';
import type { Editor } from '@tiptap/core';
import {
  IconArrowBackUp,
  IconArrowForwardUp,
  IconBold,
  IconCode,
  IconColumnInsertRight,
  IconItalic,
  IconRowInsertBottom,
  IconTableOff,
  IconTypography,
} from '@tabler/icons-react';
import { useRef, type ReactNode } from 'react';
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
import { LeadDraftLinkPopover } from './LeadDraftLinkPopover.js';
import { HeadingTool, ICON_SIZE, ToolIcon } from './LeadDraftEditorToolbarShared.js';

type Args = {
  editor: Editor;
  authorMode: boolean;
  authorId?: string;
  documentId: string;
};

/**
 * Shared editor state and controls for wide + compact lead draft toolbars.
 */
export function useLeadDraftToolbarControls({
  editor,
  authorMode,
  authorId = '',
  documentId,
}: Args) {
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

  const undoRedoTools = (
    <>
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
    </>
  );

  const blockTypeTools = (
    <>
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
    </>
  );

  const boldTool = (
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
  );

  const italicTool = (
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
  );

  const codeTool = (
    <ToolIcon
      label={t('editorToolbar.inlineCode')}
      active={editor.isActive('code')}
      disabled={inlineDisabled}
      disabledReason={authorInlineDisabledReason}
      onClick={() => {
        if (authorMode) toggleAuthorInlineMark(editor, 'code');
        else editor.chain().focus().toggleCode().run();
      }}
    >
      <IconCode size={ICON_SIZE} stroke={1.75} />
    </ToolIcon>
  );

  const tableExtras: ReactNode = editor.isActive('table') ? (
    <>
      <ToolIcon
        label={t('editorToolbar.addRow')}
        onClick={() => editor.chain().focus().addRowAfter().run()}
      >
        <IconRowInsertBottom size={ICON_SIZE} stroke={1.75} />
      </ToolIcon>
      <ToolIcon
        label={t('editorToolbar.addColumn')}
        onClick={() => editor.chain().focus().addColumnAfter().run()}
      >
        <IconColumnInsertRight size={ICON_SIZE} stroke={1.75} />
      </ToolIcon>
      <ToolIcon
        label={t('editorToolbar.deleteTable')}
        onClick={() => editor.chain().focus().deleteTable().run()}
      >
        <IconTableOff size={ICON_SIZE} stroke={1.75} />
      </ToolIcon>
    </>
  ) : null;

  return {
    t,
    imageInputRef,
    imageInput,
    calloutVariantSelect,
    codeLanguageSelect,
    linkControl,
    undoRedoTools,
    blockTypeTools,
    boldTool,
    italicTool,
    codeTool,
    tableExtras,
  };
}
