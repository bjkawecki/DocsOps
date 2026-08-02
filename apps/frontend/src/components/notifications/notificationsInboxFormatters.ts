import type { TFunction } from 'i18next';
import type { NotificationItem } from './meNotificationTypes.js';

export function eventHeadline(t: TFunction, eventType: string): string {
  return t(`notifications:eventTypes.${eventType}`, { defaultValue: eventType.replace(/-/g, ' ') });
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
  t: TFunction,
  eventType: string,
  payload: Record<string, unknown>
): string | null {
  return notificationBodyText(t, eventType, payload, { preview: true });
}

export function notificationBodyText(
  t: TFunction,
  eventType: string,
  payload: Record<string, unknown>,
  options?: { preview?: boolean }
): string | null {
  const preview = options?.preview ?? false;
  const truncate = (text: string, max: number) =>
    preview && text.length > max ? `${text.slice(0, max)}…` : text;

  if (eventType === 'admin-broadcast') {
    const title =
      typeof payload.title === 'string'
        ? payload.title
        : t('notifications:body.adminBroadcastFallbackTitle');
    const message = typeof payload.message === 'string' ? payload.message : '';
    if (message.trim() !== '') {
      return preview
        ? t('notifications:body.adminBroadcastPreview', {
            title,
            message: truncate(message, 160),
          })
        : message.trim();
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

  if (eventType === 'admin-granted') return t('notifications:body.adminGranted');
  if (eventType === 'admin-revoked') return t('notifications:body.adminRevoked');

  if (eventType === 'backup-succeeded') {
    const dest =
      typeof payload.destinationName === 'string' && payload.destinationName.trim() !== ''
        ? payload.destinationName
        : t('notifications:body.localOnly');
    const size =
      typeof payload.sizeBytes === 'number' ? ` (${Math.round(payload.sizeBytes / 1024)} KB)` : '';
    return t('notifications:body.backupSucceeded', { size, destination: dest });
  }
  if (eventType === 'backup-failed') {
    const msg =
      typeof payload.errorMessage === 'string'
        ? payload.errorMessage
        : t('notifications:body.unknownError');
    return truncate(msg, 160);
  }
  if (eventType === 'backup-restore-succeeded') {
    return t('notifications:body.backupRestoreSucceeded');
  }
  if (eventType === 'backup-restore-failed') {
    const msg =
      typeof payload.errorMessage === 'string'
        ? payload.errorMessage
        : t('notifications:body.unknownError');
    return truncate(msg, 160);
  }
  if (eventType === 'platform-export-succeeded') {
    const count = typeof payload.documentCount === 'number' ? payload.documentCount : null;
    const size =
      typeof payload.sizeBytes === 'number' ? ` (${Math.round(payload.sizeBytes / 1024)} KB)` : '';
    const countSuffix =
      count != null ? t('notifications:body.platformExportDocumentsSuffix', { count }) : '';
    return t('notifications:body.platformExportSucceeded', { size, countSuffix });
  }
  if (eventType === 'platform-export-failed') {
    const msg =
      typeof payload.errorMessage === 'string'
        ? payload.errorMessage
        : t('notifications:body.unknownError');
    return truncate(msg, 160);
  }
  if (eventType === 'platform-import-succeeded') {
    const count = typeof payload.documentCount === 'number' ? payload.documentCount : null;
    return count != null
      ? t('notifications:body.platformImportSucceededWithCount', { count })
      : t('notifications:body.platformImportSucceeded');
  }
  if (eventType === 'platform-import-failed') {
    const msg =
      typeof payload.errorMessage === 'string'
        ? payload.errorMessage
        : t('notifications:body.unknownError');
    return truncate(msg, 160);
  }
  if (eventType === 'update-available') {
    const latest =
      typeof payload.latestVersion === 'string'
        ? payload.latestVersion
        : t('notifications:body.newerVersion');
    const installed =
      typeof payload.installedVersion === 'string' ? payload.installedVersion : null;
    if (installed != null) {
      return t('notifications:body.updateAvailableWithInstalled', { latest, installed });
    }
    return t('notifications:body.updateAvailable', { latest });
  }
  if (eventType === 'update-succeeded') {
    const target =
      typeof payload.targetVersion === 'string'
        ? payload.targetVersion
        : t('notifications:body.latestRelease');
    return t('notifications:body.updateSucceeded', { target });
  }
  if (eventType === 'update-failed') {
    const msg =
      typeof payload.errorMessage === 'string'
        ? payload.errorMessage
        : t('notifications:body.unknownError');
    return truncate(msg, 160);
  }
  if (eventType === 'document-comment-created') {
    const kind = typeof payload.kind === 'string' ? payload.kind : '';
    const previewText =
      typeof payload.commentPreview === 'string' ? payload.commentPreview.trim() : '';
    if (kind === 'mention') {
      return previewText !== ''
        ? truncate(previewText, 120)
        : t('notifications:body.commentMention');
    }
    if (kind === 'reply') {
      return previewText !== '' ? truncate(previewText, 120) : t('notifications:body.commentReply');
    }
    if (previewText !== '') return truncate(previewText, 120);
    return t('notifications:body.commentGeneric');
  }
  if (eventType === 'document-moved') {
    return t('notifications:body.documentMoved');
  }
  if (eventType === 'document-move-requested') {
    return t('notifications:body.documentMoveRequested');
  }
  if (eventType === 'document-move-accepted') {
    return t('notifications:body.documentMoveAccepted');
  }
  if (eventType === 'document-move-rejected') {
    return t('notifications:body.documentMoveRejected');
  }
  if (eventType === 'document-move-withdrawn') {
    return t('notifications:body.documentMoveWithdrawn');
  }
  const draftId = payloadDraftRequestId(payload);
  if (draftId == null) return null;
  if (eventType === 'draft-request-submitted') return t('notifications:body.draftRequestSubmitted');
  if (eventType === 'draft-request-merged') return t('notifications:body.draftRequestMerged');
  if (eventType === 'draft-request-rejected') return t('notifications:body.draftRequestRejected');
  return t('notifications:body.draftRequestGeneric');
}

export function notificationSourceLabel(t: TFunction, item: NotificationItem): string {
  if (item.eventType === 'admin-broadcast') return t('notifications:source.systemMessage');
  if (
    item.eventType.startsWith('team-') ||
    item.eventType.startsWith('department-') ||
    item.eventType.startsWith('company-') ||
    item.eventType === 'admin-granted' ||
    item.eventType === 'admin-revoked'
  ) {
    return t('notifications:source.organization');
  }
  if (item.eventType.startsWith('backup-')) return t('notifications:source.system');
  if (item.eventType === 'update-available') return t('notifications:source.system');
  if (item.eventType === 'update-succeeded' || item.eventType === 'update-failed')
    return t('notifications:source.system');
  if (item.eventType.startsWith('platform-')) return t('notifications:source.system');
  if (item.eventType.startsWith('draft-request-')) return t('notifications:source.review');
  if (item.eventType === 'document-comment-created') return t('notifications:source.comment');
  if (payloadDocumentId(item.payload) != null) return t('notifications:source.document');
  return t('notifications:source.notification');
}

export function documentDisplayTitle(t: TFunction, item: NotificationItem): string {
  if (item.eventType === 'admin-broadcast') {
    const title = typeof item.payload.title === 'string' ? item.payload.title : null;
    return title != null && title.trim() !== '' ? title : t('notifications:display.systemMessage');
  }
  const orgLabel = orgScopeLabel(item.payload);
  if (orgLabel != null && item.eventType.startsWith('team-')) return orgLabel;
  if (orgLabel != null && item.eventType.startsWith('department-')) return orgLabel;
  if (orgLabel != null && item.eventType.startsWith('company-')) return orgLabel;
  if (item.eventType === 'admin-granted' || item.eventType === 'admin-revoked') {
    return t('notifications:display.platformAccess');
  }
  if (item.eventType === 'update-available') {
    const latest =
      typeof item.payload.latestVersion === 'string' ? item.payload.latestVersion : null;
    return latest != null
      ? t('notifications:display.updateVersion', { version: latest })
      : t('notifications:display.softwareUpdate');
  }

  const docId = payloadDocumentId(item.payload);
  if (docId == null) return t('notifications:display.activity');
  if (item.documentTitle != null && item.documentTitle.trim() !== '') return item.documentTitle;
  return t('notifications:display.untitledDocument');
}

export function notificationDocumentHref(
  eventType: string,
  payload: Record<string, unknown>
): string | null {
  if (eventType.startsWith('platform-export-') || eventType.startsWith('platform-import-')) {
    return '/admin/data/migration';
  }
  if (eventType === 'update-available') {
    return '/admin/platform/system';
  }
  if (eventType === 'update-succeeded' || eventType === 'update-failed') {
    return '/admin/platform/system';
  }
  const docId = payloadDocumentId(payload);
  if (docId == null) return null;
  const commentId = payloadCommentId(payload);
  if (commentId != null && eventType === 'document-comment-created') {
    return `/documents/${docId}#comment-${commentId}`;
  }
  return `/documents/${docId}`;
}
