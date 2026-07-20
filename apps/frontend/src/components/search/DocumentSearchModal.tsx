import {
  Box,
  Button,
  Divider,
  Group,
  LoadingOverlay,
  Modal,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { IconFileText } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import type { RefObject } from 'react';
import { renderSearchSnippet } from '../../utils/renderSearchSnippet';
import '../../utils/searchSnippetMark.css';
import { DocumentSearchContextIcon } from './DocumentSearchContextIcon.js';
import {
  DOCUMENT_SEARCH_MIN_CHARS,
  DOCUMENT_SEARCH_MODAL_LIMIT,
  SEARCH_HIT_TITLE_ICON,
  documentSearchContextSubtitle,
  type DocumentSearchResponse,
} from './documentSearchTypes.js';
import { SearchIcon } from './SearchIcon.js';

export type DocumentSearchModalProps = {
  opened: boolean;
  onClose: () => void;
  modalSearch: string;
  setModalSearch: (v: string) => void;
  modalSearchInputRef: RefObject<HTMLInputElement | null>;
  debouncedModalSearch: string;
  searchInputReadyForQuery: boolean;
  showSearchSpinner: boolean;
  searchDebouncePending: boolean;
  searchEnabled: boolean;
  searchError: boolean;
  searchData: DocumentSearchResponse | undefined;
  goToCatalogFromModal: () => void;
};

export function DocumentSearchModal({
  opened,
  onClose,
  modalSearch,
  setModalSearch,
  modalSearchInputRef,
  debouncedModalSearch,
  searchInputReadyForQuery,
  showSearchSpinner,
  searchDebouncePending,
  searchEnabled,
  searchError,
  searchData,
  goToCatalogFromModal,
}: DocumentSearchModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Stack gap={4}>
          <Title order={3} fz="lg" fw={600}>
            Document search
          </Title>
          <Text size="xs" c="dimmed">
            Top results, up to {DOCUMENT_SEARCH_MODAL_LIMIT} in this dialog
          </Text>
        </Stack>
      }
      centered
      radius="md"
      size="lg"
      trapFocus
      closeOnEscape
      styles={{
        content: {
          maxHeight: 'min(82dvh, 720px)',
          display: 'flex',
          flexDirection: 'column',
        },
        body: {
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
        },
      }}
    >
      <Box
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        <Box
          px="md"
          pt="xs"
          pb="sm"
          style={{
            flexShrink: 0,
            borderBottom: '1px solid var(--mantine-color-default-border)',
            backgroundColor: 'var(--mantine-color-body)',
          }}
        >
          <TextInput
            ref={modalSearchInputRef}
            value={modalSearch}
            onChange={(e) => setModalSearch(e.currentTarget.value)}
            placeholder="Search documents…"
            leftSection={<SearchIcon />}
            aria-label="Search query"
          />
          {debouncedModalSearch.length > 0 &&
            debouncedModalSearch.length < DOCUMENT_SEARCH_MIN_CHARS && (
              <Text size="sm" c="dimmed" mt="xs">
                Enter at least {DOCUMENT_SEARCH_MIN_CHARS} characters.
              </Text>
            )}
          {searchInputReadyForQuery && (
            <Text size="xs" c="dimmed" mt="xs" lh={1.4}>
              {showSearchSpinner
                ? searchDebouncePending
                  ? 'Updating query…'
                  : 'Searching…'
                : searchError
                  ? null
                  : searchData != null
                    ? `${searchData.total} hits · up to ${DOCUMENT_SEARCH_MODAL_LIMIT} here`
                    : null}
            </Text>
          )}
        </Box>
        <Box
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            paddingLeft: 'var(--mantine-spacing-md)',
            paddingRight: 'var(--mantine-spacing-md)',
            paddingTop: 'var(--mantine-spacing-sm)',
            paddingBottom: 'var(--mantine-spacing-md)',
          }}
        >
          {searchEnabled && searchError && !showSearchSpinner && (
            <Text size="sm" c="red" mb="sm">
              Search failed. Try again in Catalog or try again later.
            </Text>
          )}
          {searchEnabled && (
            <Box pos="relative" mih={showSearchSpinner ? 140 : 0}>
              <LoadingOverlay
                visible={showSearchSpinner}
                overlayProps={{ radius: 'sm', blur: 2 }}
                loaderProps={{ type: 'oval' }}
                zIndex={400}
              />
              {!searchError &&
                searchData &&
                searchData.items.length === 0 &&
                !showSearchSpinner && (
                  <Text size="sm" c="dimmed">
                    No results. The search index may lag behind Catalog data.
                  </Text>
                )}
              {!searchError && searchData && searchData.items.length > 0 && (
                <Stack component="ul" gap="sm" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {searchData.items.map((doc) => {
                    const subtitle = documentSearchContextSubtitle(doc);
                    const showSnippet = (doc.snippet?.trim() ?? '') !== '';
                    const showMeta = subtitle != null || doc.contextType != null;
                    return (
                      <Paper
                        key={doc.id}
                        component="li"
                        withBorder
                        p="sm"
                        radius="md"
                        style={{ minWidth: 0 }}
                      >
                        <Stack gap={8}>
                          <Group gap={8} wrap="nowrap" align="flex-start">
                            <IconFileText
                              size={SEARCH_HIT_TITLE_ICON}
                              style={{ flexShrink: 0, marginTop: 1 }}
                              color="var(--mantine-color-dimmed)"
                              aria-hidden
                            />
                            <Text component="div" size="sm" fw={500} style={{ minWidth: 0 }}>
                              <Link to={`/documents/${doc.id}`} onClick={onClose}>
                                {doc.title || doc.id}
                              </Link>
                            </Text>
                          </Group>
                          {showMeta && (
                            <Group gap={8} wrap="nowrap" align="center">
                              <DocumentSearchContextIcon contextType={doc.contextType} />
                              <Text size="xs" c="dimmed" lineClamp={1} style={{ minWidth: 0 }}>
                                {subtitle ?? ''}
                              </Text>
                            </Group>
                          )}
                          {showSnippet && (
                            <>
                              <Divider variant="dotted" />
                              <Box
                                component="blockquote"
                                className="docsops-search-hit-quote"
                                cite={`/documents/${doc.id}`}
                                style={{ marginTop: 2 }}
                              >
                                <Box
                                  component="div"
                                  className="docsops-search-hit-quote-inner docsops-search-snippet-mark"
                                >
                                  {renderSearchSnippet(doc.snippet!.trim())}
                                </Box>
                              </Box>
                            </>
                          )}
                        </Stack>
                      </Paper>
                    );
                  })}
                </Stack>
              )}
            </Box>
          )}
        </Box>
        <Box
          px="md"
          py="md"
          style={{
            flexShrink: 0,
            borderTop: '1px solid var(--mantine-color-default-border)',
            backgroundColor: 'var(--mantine-color-body)',
          }}
        >
          <Button variant="filled" onClick={goToCatalogFromModal} fullWidth>
            View in Catalog
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}
