import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../api/client.js';
import {
  DOCUMENT_SEARCH_DEBOUNCE_MS,
  DOCUMENT_SEARCH_MIN_CHARS,
  DOCUMENT_SEARCH_MODAL_LIMIT,
  type DocumentSearchResponse,
} from './documentSearchTypes.js';

/**
 * Global document search modal state (Ctrl/Cmd+K and dashboard hero).
 * @param options.bindGlobalHotkey – register mod+K when true (AppShell). Disable on Home if shell already binds.
 */
export function useDocumentSearch(options?: { bindGlobalHotkey?: boolean }) {
  const bindGlobalHotkey = options?.bindGlobalHotkey ?? false;
  const navigate = useNavigate();
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [modalSearch, setModalSearch] = useState('');
  const [debouncedModalSearch, setDebouncedModalSearch] = useState('');
  const [isTabVisible, setIsTabVisible] = useState(() => document.visibilityState === 'visible');
  const modalSearchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onVisibility = () => setIsTabVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    if (!bindGlobalHotkey) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'k') return;
      e.preventDefault();
      setSearchModalOpen(true);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [bindGlobalHotkey]);

  useEffect(() => {
    if (!searchModalOpen) return;
    const trimmed = modalSearch.trim();
    const id = window.setTimeout(
      () => setDebouncedModalSearch(trimmed),
      DOCUMENT_SEARCH_DEBOUNCE_MS
    );
    return () => window.clearTimeout(id);
  }, [modalSearch, searchModalOpen]);

  useEffect(() => {
    if (!searchModalOpen) return;
    const raf = window.requestAnimationFrame(() => modalSearchInputRef.current?.focus());
    return () => window.cancelAnimationFrame(raf);
  }, [searchModalOpen]);

  const searchEnabled =
    searchModalOpen && isTabVisible && debouncedModalSearch.length >= DOCUMENT_SEARCH_MIN_CHARS;

  const {
    data: searchData,
    isFetching: searchFetching,
    isError: searchError,
  } = useQuery({
    queryKey: ['document-search', debouncedModalSearch],
    queryFn: async (): Promise<DocumentSearchResponse> => {
      const params = new URLSearchParams({
        q: debouncedModalSearch,
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

  const trimmedModalSearch = modalSearch.trim();
  const trimmedDebouncedSearch = debouncedModalSearch.trim();
  const searchInputReadyForQuery =
    searchModalOpen && isTabVisible && trimmedModalSearch.length >= DOCUMENT_SEARCH_MIN_CHARS;
  const searchDebouncePending =
    searchInputReadyForQuery && trimmedModalSearch !== trimmedDebouncedSearch;
  const showSearchSpinner = searchInputReadyForQuery && (searchDebouncePending || searchFetching);

  const openSearch = (initialQuery?: string) => {
    if (initialQuery !== undefined) {
      setModalSearch(initialQuery);
      setDebouncedModalSearch(initialQuery.trim());
    }
    setSearchModalOpen(true);
  };

  const closeSearchModal = () => {
    setSearchModalOpen(false);
  };

  const goToCatalogFromModal = () => {
    const q = modalSearch.trim();
    closeSearchModal();
    void navigate({
      pathname: '/catalog',
      search: q ? `?search=${encodeURIComponent(q)}&sortBy=relevance` : '?sortBy=relevance',
    });
  };

  return {
    searchModalOpen,
    openSearch,
    closeSearchModal,
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
  };
}
