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
    'platform-export-succeeded': 'Platform export completed',
    'platform-export-failed': 'Platform export failed',
    'platform-import-succeeded': 'Platform import completed',
    'platform-import-failed': 'Platform import failed',
    'update-available': 'Software update available',
    'update-succeeded': 'Software update completed',
    'update-failed': 'Software update failed',
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
  return notificationBodyText(eventType, payload, { preview: true });
}

export function notificationBodyText(
  eventType: string,
  payload: Record<string, unknown>,
  options?: { preview?: boolean }
): string | null {
  const preview = options?.preview ?? false;
  const truncate = (text: string, max: number) =>
    preview && text.length > max ? `${text.slice(0, max)}…` : text;

  if (eventType === 'admin-broadcast') {
    const title = typeof payload.title === 'string' ? payload.title : 'System message';
    const message = typeof payload.message === 'string' ? payload.message : '';
    if (message.trim() !== '') {
      return preview ? `${title}: ${truncate(message, 160)}` : message.trim();
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
    return truncate(msg, 160);
  }
  if (eventType === 'backup-restore-succeeded') {
    return 'Database and object storage were restored from the backup archive.';
  }
  if (eventType === 'backup-restore-failed') {
    const msg = typeof payload.errorMessage === 'string' ? payload.errorMessage : 'Unknown error';
    return truncate(msg, 160);
  }
  if (eventType === 'platform-export-succeeded') {
    const count = typeof payload.documentCount === 'number' ? payload.documentCount : null;
    const size =
      typeof payload.sizeBytes === 'number' ? ` (${Math.round(payload.sizeBytes / 1024)} KB)` : '';
    return `Platform export finished${size}${count != null ? ` · ${count} documents` : ''}.`;
  }
  if (eventType === 'platform-export-failed') {
    const msg = typeof payload.errorMessage === 'string' ? payload.errorMessage : 'Unknown error';
    return truncate(msg, 160);
  }
  if (eventType === 'platform-import-succeeded') {
    const count = typeof payload.documentCount === 'number' ? payload.documentCount : null;
    return count != null
      ? `Imported ${count} documents. Search index reindex was queued.`
      : 'Platform data imported. Search index reindex was queued.';
  }
  if (eventType === 'platform-import-failed') {
    const msg = typeof payload.errorMessage === 'string' ? payload.errorMessage : 'Unknown error';
    return truncate(msg, 160);
  }
  if (eventType === 'update-available') {
    const latest =
      typeof payload.latestVersion === 'string' ? payload.latestVersion : 'a newer version';
    const installed =
      typeof payload.installedVersion === 'string' ? payload.installedVersion : null;
    if (installed != null) {
      return `Version ${latest} is available (installed: ${installed}). Open Admin → System for update steps.`;
    }
    return `Version ${latest} is available. Open Admin → System for update steps.`;
  }
  if (eventType === 'update-succeeded') {
    const target =
      typeof payload.targetVersion === 'string' ? payload.targetVersion : 'the latest release';
    return `DocsOps was upgraded to ${target}.`;
  }
  if (eventType === 'update-failed') {
    const msg = typeof payload.errorMessage === 'string' ? payload.errorMessage : 'Unknown error';
    return truncate(msg, 160);
  }
  if (eventType === 'document-comment-created') {
    const kind = typeof payload.kind === 'string' ? payload.kind : '';
    const previewText =
      typeof payload.commentPreview === 'string' ? payload.commentPreview.trim() : '';
    if (kind === 'mention') {
      return previewText !== '' ? truncate(previewText, 120) : 'You were mentioned in a comment.';
    }
    if (kind === 'reply') {
      return previewText !== ''
        ? truncate(previewText, 120)
        : 'Someone replied in a comment thread.';
    }
    if (previewText !== '') return truncate(previewText, 120);
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

export function notificationSourceLabel(item: NotificationItem): string {
  if (item.eventType === 'admin-broadcast') return 'System message';
  if (
    item.eventType.startsWith('team-') ||
    item.eventType.startsWith('department-') ||
    item.eventType.startsWith('company-') ||
    item.eventType === 'admin-granted' ||
    item.eventType === 'admin-revoked'
  ) {
    return 'Organization';
  }
  if (item.eventType.startsWith('backup-')) return 'System';
  if (item.eventType === 'update-available') return 'System';
  if (item.eventType === 'update-succeeded' || item.eventType === 'update-failed') return 'System';
  if (item.eventType.startsWith('platform-')) return 'System';
  if (item.eventType.startsWith('draft-request-')) return 'Review';
  if (item.eventType === 'document-comment-created') return 'Comment';
  if (payloadDocumentId(item.payload) != null) return 'Document';
  return 'Notification';
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
  if (item.eventType === 'update-available') {
    const latest =
      typeof item.payload.latestVersion === 'string' ? item.payload.latestVersion : null;
    return latest != null ? `Update ${latest}` : 'Software update';
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
  if (eventType.startsWith('platform-export-') || eventType.startsWith('platform-import-')) {
    return '/admin/migration';
  }
  if (eventType === 'update-available') {
    return '/admin/system';
  }
  if (eventType === 'update-succeeded' || eventType === 'update-failed') {
    return '/admin/system';
  }
  const docId = payloadDocumentId(payload);
  if (docId == null) return null;
  const commentId = payloadCommentId(payload);
  if (commentId != null && eventType === 'document-comment-created') {
    return `/documents/${docId}#comment-${commentId}`;
  }
  return `/documents/${docId}`;
}
