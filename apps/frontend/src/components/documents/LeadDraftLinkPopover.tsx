import { ActionIcon, Button, Group, Popover, Stack, TextInput, Tooltip } from '@mantine/core';
import type { Editor } from '@tiptap/core';
import { IconLink } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { isAllowedLinkHref } from '../../lib/blockLinkHref.js';
import { setAuthorLink } from '../../tiptap/authorFormatGuards.js';
import toolbarClasses from './LeadDraftEditorToolbar.module.css';

type Props = {
  editor: Editor;
  authorMode: boolean;
  disabled: boolean;
  disabledReason?: string;
  active: boolean;
};

function seedFromEditor(editor: Editor): { href: string; label: string } {
  const linkAttrs = editor.getAttributes('link') as { href?: unknown };
  const href = typeof linkAttrs.href === 'string' ? linkAttrs.href : '';
  if (editor.isActive('link')) {
    editor.chain().focus().extendMarkRange('link').run();
  }
  const { from, to } = editor.state.selection;
  const label = from < to ? editor.state.doc.textBetween(from, to) : '';
  return { href, label };
}

function applyLink(editor: Editor, authorMode: boolean, href: string, label: string): void {
  const text = label.trim().length > 0 ? label.trim() : href;

  if (authorMode) {
    if (editor.isActive('link')) {
      editor.chain().focus().extendMarkRange('link').run();
    }
    const { from, to, empty } = editor.state.selection;
    const selected = empty ? '' : editor.state.doc.textBetween(from, to);
    if (empty) {
      editor.chain().focus().insertContent(text).run();
      editor
        .chain()
        .focus()
        .setTextSelection({ from, to: from + text.length })
        .run();
    } else if (selected !== text) {
      editor.chain().focus().insertContent(text).run();
      editor
        .chain()
        .focus()
        .setTextSelection({ from, to: from + text.length })
        .run();
    }
    setAuthorLink(editor, href);
    return;
  }

  if (editor.isActive('link')) {
    editor.chain().focus().extendMarkRange('link').run();
  }
  const { from, to } = editor.state.selection;
  const mark = editor.state.schema.marks.link;
  if (!mark) return;
  editor
    .chain()
    .focus()
    .command(({ tr, dispatch }) => {
      if (!dispatch) return true;
      tr.insertText(text, from, to);
      tr.addMark(from, from + text.length, mark.create({ href }));
      dispatch(tr);
      return true;
    })
    .run();
}

function removeLink(editor: Editor, authorMode: boolean): void {
  if (authorMode) {
    setAuthorLink(editor, null);
    return;
  }
  editor.chain().focus().extendMarkRange('link').unsetLink().run();
}

export function LeadDraftLinkPopover({
  editor,
  authorMode,
  disabled,
  disabledReason,
  active,
}: Props) {
  const [opened, setOpened] = useState(false);
  const [href, setHref] = useState('');
  const [label, setLabel] = useState('');
  const [hrefError, setHrefError] = useState<string | null>(null);

  useEffect(() => {
    if (!opened) return;
    const seed = seedFromEditor(editor);
    setHref(seed.href);
    setLabel(seed.label);
    setHrefError(null);
  }, [opened, editor]);

  const submit = (): void => {
    const nextHref = href.trim();
    if (nextHref === '') {
      setHrefError('Enter a URL or #heading-slug');
      return;
    }
    if (!isAllowedLinkHref(nextHref)) {
      setHrefError('Only http(s) URLs or #heading-slug links are allowed');
      return;
    }
    applyLink(editor, authorMode, nextHref, label);
    setOpened(false);
  };

  const button = (
    <ActionIcon
      size={28}
      variant={active ? 'filled' : 'light'}
      disabled={disabled}
      onClick={() => setOpened((o) => !o)}
      aria-label="Link"
    >
      <IconLink size={16} stroke={1.75} />
    </ActionIcon>
  );

  return (
    <Tooltip
      label={disabled && disabledReason ? disabledReason : 'Link'}
      withArrow
      disabled={opened}
    >
      <span className={toolbarClasses.toolHit}>
        <Popover
          width={320}
          position="bottom-start"
          withArrow
          shadow="md"
          opened={opened}
          onChange={setOpened}
          disabled={disabled}
          withinPortal
          zIndex={400}
        >
          <Popover.Target>{button}</Popover.Target>
          <Popover.Dropdown>
            <Stack gap="xs">
              <TextInput
                label="Text"
                placeholder="Link label"
                size="xs"
                value={label}
                onChange={(e) => setLabel(e.currentTarget.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    submit();
                  }
                }}
              />
              <TextInput
                label="URL"
                placeholder="https://… or #heading-slug"
                size="xs"
                value={href}
                error={hrefError}
                onChange={(e) => {
                  setHref(e.currentTarget.value);
                  setHrefError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    submit();
                  }
                }}
                data-autofocus
              />
              <Group gap="xs" justify="space-between">
                <Button
                  size="compact-xs"
                  variant="subtle"
                  color="red"
                  disabled={!active}
                  onClick={() => {
                    removeLink(editor, authorMode);
                    setOpened(false);
                  }}
                >
                  Remove
                </Button>
                <Group gap="xs">
                  <Button size="compact-xs" variant="default" onClick={() => setOpened(false)}>
                    Cancel
                  </Button>
                  <Button size="compact-xs" onClick={submit}>
                    Apply
                  </Button>
                </Group>
              </Group>
            </Stack>
          </Popover.Dropdown>
        </Popover>
      </span>
    </Tooltip>
  );
}
