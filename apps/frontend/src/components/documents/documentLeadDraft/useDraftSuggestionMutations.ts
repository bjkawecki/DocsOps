import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { useEffect, useRef } from 'react';
import { apiFetch } from '../../../api/client.js';
import type { BlockDocument } from '../../../api/document-types.js';

export type SuggestionMutationAction = 'accept' | 'decline' | 'withdraw';

type Args = {
  documentId: string;
  draftRevision: number;
  onApplied: (revision: number, blocks: BlockDocument) => void;
};

export function useDraftSuggestionMutations({ documentId, draftRevision, onApplied }: Args) {
  const queryClient = useQueryClient();
  const draftRevisionRef = useRef(draftRevision);

  useEffect(() => {
    draftRevisionRef.current = draftRevision;
  }, [draftRevision]);

  const mutation = useMutation({
    mutationFn: async (args: { action: SuggestionMutationAction; suggestionId: string }) => {
      const { action, suggestionId } = args;
      const path =
        action === 'withdraw'
          ? `/api/v1/documents/${documentId}/draft/suggestions/${suggestionId}`
          : `/api/v1/documents/${documentId}/draft/suggestions/${suggestionId}/${action}`;
      const res = await apiFetch(path, {
        method: action === 'withdraw' ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expectedRevision: draftRevisionRef.current }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(typeof err.error === 'string' ? err.error : res.statusText);
      }
      return (await res.json()) as { draftRevision: number; blocks: BlockDocument };
    },
    onSuccess: (body) => {
      onApplied(body.draftRevision, body.blocks);
      void queryClient.invalidateQueries({ queryKey: ['document', documentId, 'lead-draft'] });
      void queryClient.invalidateQueries({ queryKey: ['me', 'reviews'] });
    },
    onError: (err: Error) => {
      notifications.show({ color: 'red', title: 'Suggestion action failed', message: err.message });
    },
  });

  return mutation;
}
