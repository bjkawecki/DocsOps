import { apiFetch } from '../../api/client.js';
import type { DocumentResponse } from './documentPageTypes.js';

export async function fetchDocument(documentId: string): Promise<DocumentResponse> {
  const res = await apiFetch(`/api/v1/documents/${documentId}`);
  if (res.status === 404) throw new Error('not-found');
  if (res.status === 403) throw new Error('forbidden');
  if (!res.ok) throw new Error('Failed to load document');
  return res.json() as Promise<DocumentResponse>;
}
