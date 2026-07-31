import {
  ActionIcon,
  Button,
  Group,
  Loader,
  Popover,
  ScrollArea,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
  Tooltip,
  UnstyledButton,
} from '@mantine/core';
import type { Editor } from '@tiptap/core';
import { IconLink } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { apiFetch } from '../../api/client.js';
import { isAllowedEditorLinkHref, isAllowedLinkHref } from '../../lib/blockLinkHref.js';
import { docsopsDocHrefToken, parseDocsopsDocHrefToken } from '../../lib/docsopsDocLink.js';
import { setAuthorLink } from '../../tiptap/authorFormatGuards.js';
import {
  DOCUMENT_SEARCH_DEBOUNCE_MS,
  DOCUMENT_SEARCH_MIN_CHARS,
  DOCUMENT_SEARCH_MODAL_LIMIT,
  documentSearchContextSubtitle,
  type DocumentSearchItem,
  type DocumentSearchResponse,
} from '../search/documentSearchTypes.js';
import toolbarClasses from './LeadDraftEditorToolbar.module.css';

type LinkMode = 'url' | 'document';

type Props = {
  editor: Editor;
  authorMode: boolean;
  disabled: boolean;
  disabledReason?: string;
  active: boolean;
};

function seedFromEditor(editor: Editor): { href: string; label: string; mode: LinkMode } {
  const linkAttrs = editor.getAttributes('link') as { href?: unknown };
  const href = typeof linkAttrs.href === 'string' ? linkAttrs.href : '';
  if (editor.isActive('link')) {
    editor.chain().focus().extendMarkRange('link').run();
  }
  const { from, to } = editor.state.selection;
  const label = from < to ? editor.state.doc.textBetween(from, to) : '';
  const mode: LinkMode = parseDocsopsDocHrefToken(href) != null ? 'document' : 'url';
  return { href, label, mode };
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
  const [mode, setMode] = useState<LinkMode>('url');
  const [href, setHref] = useState('');
  const [label, setLabel] = useState('');
  const [hrefError, setHrefError] = useState<string | null>(null);
  const [docQuery, setDocQuery] = useState('');
  const [debouncedDocQuery, setDebouncedDocQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<DocumentSearchItem | null>(null);

  useEffect(() => {
    if (!opened) return;
    const seed = seedFromEditor(editor);
    setHref(seed.href);
    setLabel(seed.label);
    setMode(seed.mode);
    setHrefError(null);
    setDocQuery('');
    setDebouncedDocQuery('');
    const docId = parseDocsopsDocHrefToken(seed.href);
    setSelectedDoc(
      docId != null
        ? {
            id: docId,
            title: seed.label.trim().length > 0 ? seed.label.trim() : 'Document',
            contextName: null,
            contextType: null,
            snippet: null,
            updatedAt: '',
            rank: 0,
          }
        : null
    );
  }, [opened, editor]);

  useEffect(() => {
    if (!opened || mode !== 'document') return;
    const trimmed = docQuery.trim();
    const id = window.setTimeout(() => setDebouncedDocQuery(trimmed), DOCUMENT_SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [docQuery, opened, mode]);

  const searchEnabled =
    opened && mode === 'document' && debouncedDocQuery.length >= DOCUMENT_SEARCH_MIN_CHARS;

  const {
    data: searchData,
    isFetching: searchFetching,
    isError: searchError,
  } = useQuery({
    queryKey: ['document-link-picker', debouncedDocQuery],
    queryFn: async (): Promise<DocumentSearchResponse> => {
      const params = new URLSearchParams({
        q: debouncedDocQuery,
        limit: String(DOCUMENT_SEARCH_MODAL_LIMIT),
        offset: '0',
      });
      const res = await apiFetch(`/api/v1/search/documents?${params}`);
      if (!res.ok) throw new Error('Failed to search documents');
      return (await res.json()) as DocumentSearchResponse;
    },
    enabled: searchEnabled,
    placeholderData: (previousData) => previousData,
  });

  const submitUrl = (): void => {
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

  const submitDocument = (): void => {
    if (selectedDoc == null) {
      setHrefError('Select a document');
      return;
    }
    const nextHref = docsopsDocHrefToken(selectedDoc.id);
    if (!isAllowedEditorLinkHref(nextHref)) {
      setHrefError('Invalid document link');
      return;
    }
    const nextLabel = label.trim().length > 0 ? label : selectedDoc.title;
    applyLink(editor, authorMode, nextHref, nextLabel);
    setOpened(false);
  };

  const submit = (): void => {
    if (mode === 'document') submitDocument();
    else submitUrl();
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
          width={340}
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
              <SegmentedControl
                size="xs"
                fullWidth
                value={mode}
                onChange={(value) => {
                  setMode(value as LinkMode);
                  setHrefError(null);
                }}
                data={[
                  { label: 'URL', value: 'url' },
                  { label: 'Document', value: 'document' },
                ]}
              />
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
              {mode === 'url' ? (
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
              ) : (
                <Stack gap={6}>
                  <TextInput
                    label="Document"
                    placeholder="Search documents…"
                    size="xs"
                    value={docQuery}
                    error={hrefError}
                    onChange={(e) => {
                      setDocQuery(e.currentTarget.value);
                      setHrefError(null);
                    }}
                    data-autofocus
                  />
                  {selectedDoc != null ? (
                    <Text size="xs" c="dimmed">
                      Selected: {selectedDoc.title}
                    </Text>
                  ) : null}
                  {searchEnabled ? (
                    <ScrollArea.Autosize mah={180} type="scroll">
                      <Stack gap={2}>
                        {searchFetching ? (
                          <Group gap="xs" justify="center" py="xs">
                            <Loader size="xs" />
                          </Group>
                        ) : null}
                        {searchError ? (
                          <Text size="xs" c="red">
                            Search failed
                          </Text>
                        ) : null}
                        {(searchData?.items ?? []).map((item) => {
                          const subtitle = documentSearchContextSubtitle(item);
                          return (
                            <UnstyledButton
                              key={item.id}
                              onClick={() => {
                                setSelectedDoc(item);
                                setHrefError(null);
                                if (label.trim().length === 0) setLabel(item.title);
                              }}
                              style={{
                                display: 'block',
                                width: '100%',
                                padding: '6px 8px',
                                borderRadius: 6,
                                background:
                                  selectedDoc?.id === item.id
                                    ? 'var(--mantine-color-default-hover)'
                                    : undefined,
                              }}
                            >
                              <Text size="xs" fw={500} lineClamp={1}>
                                {item.title}
                              </Text>
                              {subtitle ? (
                                <Text size="xs" c="dimmed" lineClamp={1}>
                                  {subtitle}
                                </Text>
                              ) : null}
                            </UnstyledButton>
                          );
                        })}
                        {!searchFetching &&
                        !searchError &&
                        (searchData?.items.length ?? 0) === 0 ? (
                          <Text size="xs" c="dimmed">
                            No documents found
                          </Text>
                        ) : null}
                      </Stack>
                    </ScrollArea.Autosize>
                  ) : (
                    <Text size="xs" c="dimmed">
                      Type at least {DOCUMENT_SEARCH_MIN_CHARS} characters to search
                    </Text>
                  )}
                </Stack>
              )}
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
