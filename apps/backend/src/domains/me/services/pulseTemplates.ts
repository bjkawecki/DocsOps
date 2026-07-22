import type { PulseItemKind } from '../schemas/me.js';

/**
 * Category label bodies only (no colon, no quantity; document / scope are subject line in UI).
 */
export function buildPulseBody(args: {
  kind: PulseItemKind;
  title: string;
  scopeName: string;
  contextName: string | null;
  contextTypeLabel: string | null;
  commentCount?: number;
  pendingSuggestionCount?: number;
  decision?: 'merged' | 'rejected';
}): string {
  switch (args.kind) {
    case 'document-new':
      return 'New Document';
    case 'document-updated':
      return 'Updated Document';
    case 'document-comments':
      return 'Comments';
    case 'draft-open':
      return 'Draft unfinished';
    case 'review-awaiting':
      return 'Review';
    case 'review-decided':
      return args.decision === 'rejected' ? 'Rejected suggestion' : 'Merged suggestion';
    default:
      return args.title.trim() || 'Untitled';
  }
}
