import type { PulseItemKind } from '../schemas/me.js';

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
  const scope = args.scopeName.trim() || 'Personal';
  const title = args.title.trim() || 'Untitled';
  const ctx = args.contextName?.trim() || null;
  const ctxType = args.contextTypeLabel;

  switch (args.kind) {
    case 'document-new': {
      if (ctx && ctxType) {
        return `For ${scope}, ${ctxType} ${ctx} has a new document: ${title}`;
      }
      if (ctx) return `For ${scope}, ${ctx} has a new document: ${title}`;
      return `For ${scope}, a new document is ready: ${title}`;
    }
    case 'document-updated': {
      if (ctx) return `For ${scope}, ${ctx}: ${title} was updated.`;
      return `For ${scope}, ${title} was updated.`;
    }
    case 'document-comments': {
      const n = args.commentCount ?? 1;
      const noun = n === 1 ? 'comment' : 'comments';
      return `For ${scope}, ${title} has ${n} new ${noun}.`;
    }
    case 'draft-open':
      return `Open draft: ${title}`;
    case 'review-awaiting': {
      const n = args.pendingSuggestionCount ?? 0;
      const noun = n === 1 ? 'suggestion' : 'suggestions';
      return `Needs your review: ${title} (${n} ${noun})`;
    }
    case 'review-decided': {
      const decision = args.decision === 'rejected' ? 'rejected' : 'merged';
      return `Your review request for ${title} was ${decision}.`;
    }
    default:
      return title;
  }
}
