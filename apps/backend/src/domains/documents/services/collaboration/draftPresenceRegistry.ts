const PRESENCE_TTL_MS = 45_000;

type EditorEntry = {
  userId: string;
  name: string;
  lastSeen: number;
};

const editorsByDocument = new Map<string, Map<string, EditorEntry>>();

function pruneDocument(documentId: string, now: number): EditorEntry[] {
  const bucket = editorsByDocument.get(documentId);
  if (!bucket) return [];
  for (const [userId, entry] of bucket) {
    if (now - entry.lastSeen > PRESENCE_TTL_MS) bucket.delete(userId);
  }
  if (bucket.size === 0) {
    editorsByDocument.delete(documentId);
    return [];
  }
  return [...bucket.values()];
}

export function registerDraftEditorPresence(
  documentId: string,
  userId: string,
  name: string
): EditorEntry[] {
  const now = Date.now();
  let bucket = editorsByDocument.get(documentId);
  if (!bucket) {
    bucket = new Map();
    editorsByDocument.set(documentId, bucket);
  }
  bucket.set(userId, { userId, name, lastSeen: now });
  return pruneDocument(documentId, now);
}

export function unregisterDraftEditorPresence(documentId: string, userId: string): EditorEntry[] {
  const bucket = editorsByDocument.get(documentId);
  if (bucket) bucket.delete(userId);
  return pruneDocument(documentId, Date.now());
}

export function listDraftEditorPresence(documentId: string): EditorEntry[] {
  return pruneDocument(documentId, Date.now());
}

/** @internal Test helper */
export function clearDraftPresenceRegistryForTests(): void {
  editorsByDocument.clear();
}
