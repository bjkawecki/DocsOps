import type { NotificationItem } from './meNotificationTypes.js';

export function eventHeadline(eventType: string): string {
  const labels: Record<string, string> = {
    'document-created': 'Document created',
    'document-updated': 'Document updated',
    'document-deleted': 'Document moved to trash',
    'document-published': 'Document published',
    'document-archived': 'Document archived',
    'document-restored': 'Document restored',
    'document-grants-changed': 'Document access changed',
    'document-comment-created': 'New comment on document',
    'draft-request-submitted': 'Review request submitted',
    'draft-request-merged': 'Review request merged',
    'draft-request-rejected': 'Review request rejected',
    'backup-succeeded': 'Backup completed successfully',
    'backup-failed': 'Backup failed',
    'backup-restore-succeeded': 'Restore completed successfully',
    'backup-restore-failed': 'Restore failed',
    'admin-broadcast': 'System message',
    'team-member-added': 'Added to team',
    'team-member-removed': 'Removed from team',
    'team-lead-assigned': 'Team lead role assigned',
    'team-lead-removed': 'Team lead role removed',
    'department-lead-assigned': 'Department lead role assigned',
    'department-lead-removed': 'Department lead role removed',
    'company-lead-assigned': 'Company lead role assigned',
    'company-lead-removed': 'Company lead role removed',
    'admin-granted': 'Administrator access granted',
    'admin-revoked': 'Administrator access revoked',
  };
  return labels[eventType] ?? eventType.replace(/-/g, ' ');
}

export function payloadDocumentId(payload: Record<string, unknown>): string | null {
  return typeof payload.documentId === 'string' ? payload.documentId : null;
}

function payloadCommentId(payload: Record<string, unknown>): string | null {
  return typeof payload.commentId === 'string' ? payload.commentId : null;
}

function payloadDraftRequestId(payload: Record<string, unknown>): string | null {
  return typeof payload.draftRequestId === 'string' ? payload.draftRequestId : null;
}

function orgScopeLabel(payload: Record<string, unknown>): string | null {
  const scopeName = typeof payload.scopeName === 'string' ? payload.scopeName : null;
  const scopeType = typeof payload.scopeType === 'string' ? payload.scopeType : null;
  if (scopeName == null) return null;
  if (scopeType === 'platform') return scopeName;
  return scopeType != null ? `${scopeName} (${scopeType})` : scopeName;
}

export function secondaryDetail(
  eventType: string,
  payload: Record<string, unknown>
): string | null {
  if (eventType === 'admin-broadcast') {
    const title = typeof payload.title === 'string' ? payload.title : 'System message';
    const message = typeof payload.message === 'string' ? payload.message : '';
    if (message.trim() !== '') {
      const preview = message.length > 160 ? `${message.slice(0, 160)}…` : message;
      return `${title}: ${preview}`;
    }
    return title;
  }

  if (
    eventType.startsWith('team-') ||
    eventType.startsWith('department-') ||
    eventType.startsWith('company-')
  ) {
    return orgScopeLabel(payload);
  }

  if (eventType === 'admin-granted') return 'You were granted platform administrator access.';
  if (eventType === 'admin-revoked') return 'Your platform administrator access was revoked.';

  if (eventType === 'backup-succeeded') {
    const dest =
      typeof payload.destinationName === 'string' && payload.destinationName.trim() !== ''
        ? payload.destinationName
        : 'local only';
    const size =
      typeof payload.sizeBytes === 'number' ? ` (${Math.round(payload.sizeBytes / 1024)} KB)` : '';
    return `Operational backup finished${size}. External destination: ${dest}.`;
  }
  if (eventType === 'backup-failed') {
    const msg = typeof payload.errorMessage === 'string' ? payload.errorMessage : 'Unknown error';
    return msg.length > 160 ? `${msg.slice(0, 160)}…` : msg;
  }
  if (eventType === 'backup-restore-succeeded') {
    return 'Database and object storage were restored from the backup archive.';
  }
  if (eventType === 'backup-restore-failed') {
    const msg = typeof payload.errorMessage === 'string' ? payload.errorMessage : 'Unknown error';
    return msg.length > 160 ? `${msg.slice(0, 160)}…` : msg;
  }
  if (eventType === 'document-comment-created') {
    const kind = typeof payload.kind === 'string' ? payload.kind : '';
    const preview = typeof payload.commentPreview === 'string' ? payload.commentPreview.trim() : '';
    if (kind === 'mention') {
      return preview !== '' ? preview : 'You were mentioned in a comment.';
    }
    if (kind === 'reply') {
      return preview !== '' ? preview : 'Someone replied in a comment thread.';
    }
    if (preview !== '') return preview.length > 120 ? `${preview.slice(0, 120)}…` : preview;
    return 'New activity in a comment thread.';
  }
  const draftId = payloadDraftRequestId(payload);
  if (draftId == null) return null;
  if (eventType === 'draft-request-submitted') return 'A review request is open for this document.';
  if (eventType === 'draft-request-merged')
    return 'Your proposed changes were merged into the published version.';
  if (eventType === 'draft-request-rejected') return 'Your review request was rejected.';
  return 'Related to a review request.';
}

export function documentDisplayTitle(item: NotificationItem): string {
  if (item.eventType === 'admin-broadcast') {
    const title = typeof item.payload.title === 'string' ? item.payload.title : null;
    return title != null && title.trim() !== '' ? title : 'System message';
  }
  const orgLabel = orgScopeLabel(item.payload);
  if (orgLabel != null && item.eventType.startsWith('team-')) return orgLabel;
  if (orgLabel != null && item.eventType.startsWith('department-')) return orgLabel;
  if (orgLabel != null && item.eventType.startsWith('company-')) return orgLabel;
  if (item.eventType === 'admin-granted' || item.eventType === 'admin-revoked') {
    return 'Platform access';
  }

  const docId = payloadDocumentId(item.payload);
  if (docId == null) return 'Activity';
  if (item.documentTitle != null && item.documentTitle.trim() !== '') return item.documentTitle;
  return 'Untitled document';
}

export function notificationDocumentHref(
  eventType: string,
  payload: Record<string, unknown>
): string | null {
  const docId = payloadDocumentId(payload);
  if (docId == null) return null;
  const commentId = payloadCommentId(payload);
  if (commentId != null && eventType === 'document-comment-created') {
    return `/documents/${docId}#comment-${commentId}`;
  }
  return `/documents/${docId}`;
}
