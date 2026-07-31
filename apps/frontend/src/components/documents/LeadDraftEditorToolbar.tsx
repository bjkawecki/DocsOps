import { ActionIcon, Box, NativeSelect, Text, Tooltip } from '@mantine/core';
import type { Editor } from '@tiptap/core';
import {
  IconBold,
  IconCode,
  IconColumnInsertRight,
  IconFileCode,
  IconItalic,
  IconList,
  IconListNumbers,
  IconMinus,
  IconPhoto,
  IconQuote,
  IconRowInsertBottom,
  IconTable,
  IconTableOff,
  IconTypography,
} from '@tabler/icons-react';
import { useRef, type ReactNode } from 'react';
import {
  authorSelectionAllowsInlineFormat,
  toggleAuthorInlineMark,
} from '../../tiptap/authorFormatGuards.js';
import { insertImageFromFile } from '../../lib/uploadDocumentImage.js';
import { CODE_LANGUAGE_OPTIONS, normalizeCodeLanguage } from '../../lib/normalizeCodeLanguage.js';
import { LeadDraftLinkPopover } from './LeadDraftLinkPopover.js';
import classes from './LeadDraftEditorToolbar.module.css';

type Props = {
  editor: Editor;
  authorMode: boolean;
  authorId?: string;
  documentId: string;
};

const AUTHOR_INLINE_DISABLED =
  'Inline formatting applies only to your suggested text, not existing content.';

const ICON_SIZE = 16;

function ToolCluster({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box className={classes.cluster}>
      <Text className={classes.clusterTitle}>{title}</Text>
      <div className={classes.clusterTools}>{children}</div>
    </Box>
  );
}

function ToolIcon({
  label,
  active,
  disabled = false,
  disabledReason,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  disabledReason?: string;
  onClick: () => void;
  children: ReactNode;
}) {
  const control = (
    <ActionIcon
      size={28}
      variant={active ? 'filled' : 'light'}
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
    >
      {children}
    </ActionIcon>
  );
  return (
    <Tooltip label={disabled && disabledReason ? disabledReason : label} withArrow>
      <span className={classes.toolHit}>{control}</span>
    </Tooltip>
  );
}

function HeadingTool({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Tooltip label={label} withArrow>
      <span className={classes.toolHit}>
        <ActionIcon
          size={28}
          variant={active ? 'filled' : 'light'}
          onClick={onClick}
          aria-label={label}
        >
          <span className={classes.headingLabel}>{label}</span>
        </ActionIcon>
      </span>
    </Tooltip>
  );
}

export function LeadDraftEditorToolbar({ editor, authorMode, authorId = '', documentId }: Props) {
  const inlineDisabled = authorMode && !authorSelectionAllowsInlineFormat(editor, authorId);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const linkControl = (
    <LeadDraftLinkPopover
      editor={editor}
      authorMode={authorMode}
      disabled={inlineDisabled}
      disabledReason={inlineDisabled ? AUTHOR_INLINE_DISABLED : undefined}
      active={editor.isActive('link')}
    />
  );

  return (
    <div className={classes.row}>
      <ToolCluster title="Block">
        <HeadingTool
          label="H1"
          active={editor.isActive('heading', { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        />
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
          label="Paragraph"
          active={editor.isActive('paragraph')}
          onClick={() => editor.chain().focus().setParagraph().run()}
        >
          <IconTypography size={ICON_SIZE} stroke={1.75} />
        </ToolIcon>
      </ToolCluster>

      {!authorMode && (
        <ToolCluster title="Insert">
          <ToolIcon
            label="Bullet list"
            active={editor.isActive('bulletList')}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <IconList size={ICON_SIZE} stroke={1.75} />
          </ToolIcon>
          <ToolIcon
            label="Numbered list"
            active={editor.isActive('orderedList')}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <IconListNumbers size={ICON_SIZE} stroke={1.75} />
          </ToolIcon>
          <ToolIcon
            label="Quote"
            active={editor.isActive('blockquote')}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            <IconQuote size={ICON_SIZE} stroke={1.75} />
          </ToolIcon>
          <ToolIcon
            label="Divider"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
          >
            <IconMinus size={ICON_SIZE} stroke={1.75} />
          </ToolIcon>
          <ToolIcon
            label="Code block"
            active={editor.isActive('codeBlock')}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          >
            <IconFileCode size={ICON_SIZE} stroke={1.75} />
          </ToolIcon>
          {editor.isActive('codeBlock') && (
            <NativeSelect
              size="xs"
              aria-label="Code language"
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
          )}
          <ToolIcon
            label="Image"
            active={editor.isActive('image')}
            onClick={() => imageInputRef.current?.click()}
          >
            <IconPhoto size={ICON_SIZE} stroke={1.75} />
          </ToolIcon>
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
          <ToolIcon
            label="Table"
            active={editor.isActive('table')}
            onClick={() =>
              editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
            }
          >
            <IconTable size={ICON_SIZE} stroke={1.75} />
          </ToolIcon>
          {editor.isActive('table') && (
            <>
              <ToolIcon label="Add row" onClick={() => editor.chain().focus().addRowAfter().run()}>
                <IconRowInsertBottom size={ICON_SIZE} stroke={1.75} />
              </ToolIcon>
              <ToolIcon
                label="Add column"
                onClick={() => editor.chain().focus().addColumnAfter().run()}
              >
                <IconColumnInsertRight size={ICON_SIZE} stroke={1.75} />
              </ToolIcon>
              <ToolIcon
                label="Delete table"
                onClick={() => editor.chain().focus().deleteTable().run()}
              >
                <IconTableOff size={ICON_SIZE} stroke={1.75} />
              </ToolIcon>
            </>
          )}
        </ToolCluster>
      )}

      <ToolCluster title="Format">
        <ToolIcon
          label="Bold"
          active={editor.isActive('bold')}
          disabled={inlineDisabled}
          disabledReason={AUTHOR_INLINE_DISABLED}
          onClick={() => {
            if (authorMode) {
              toggleAuthorInlineMark(editor, 'bold');
            } else {
              editor.chain().focus().toggleBold().run();
            }
          }}
        >
          <IconBold size={ICON_SIZE} stroke={1.75} />
        </ToolIcon>
        <ToolIcon
          label="Italic"
          active={editor.isActive('italic')}
          disabled={inlineDisabled}
          disabledReason={AUTHOR_INLINE_DISABLED}
          onClick={() => {
            if (authorMode) {
              toggleAuthorInlineMark(editor, 'italic');
            } else {
              editor.chain().focus().toggleItalic().run();
            }
          }}
        >
          <IconItalic size={ICON_SIZE} stroke={1.75} />
        </ToolIcon>
        <ToolIcon
          label="Inline code"
          active={editor.isActive('code')}
          disabled={inlineDisabled}
          disabledReason={AUTHOR_INLINE_DISABLED}
          onClick={() => {
            if (authorMode) {
              toggleAuthorInlineMark(editor, 'code');
            } else {
              editor.chain().focus().toggleCode().run();
            }
          }}
        >
          <IconCode size={ICON_SIZE} stroke={1.75} />
        </ToolIcon>
        {linkControl}
      </ToolCluster>
    </div>
  );
}
