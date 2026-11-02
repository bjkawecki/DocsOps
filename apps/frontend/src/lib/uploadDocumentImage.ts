import { notifications } from '@mantine/notifications';
import type { Editor } from '@tiptap/core';
import { apiFetch } from '../api/client';
import { documentAttachmentUrl, isAllowedImageUploadMime } from './figureCaption.js';
import { randomId } from './randomId.js';

type UploadedAttachment = {
  id: string;
  filename: string;
  contentType: string | null;
};

export async function uploadDocumentImageAttachment(
  documentId: string,
  file: File
): Promise<UploadedAttachment> {
  if (!isAllowedImageUploadMime(file.type)) {
    throw new Error('Only JPEG, PNG, GIF, or WebP images are allowed');
  }
  const res = await apiFetch(`/api/v1/documents/${documentId}/attachments`, {
    method: 'POST',
    headers: {
      'X-Filename': file.name,
      'Content-Type': file.type || 'application/octet-stream',
    },
    body: file,
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(err?.error ?? `Upload failed (${res.status})`);
  }
  return (await res.json()) as UploadedAttachment;
}

export async function insertImageFromFile(
  editor: Editor,
  documentId: string,
  file: File
): Promise<void> {
  try {
    const uploaded = await uploadDocumentImageAttachment(documentId, file);
    editor
      .chain()
      .focus()
      .insertContent({
        type: 'image',
        attrs: {
          blockId: randomId(),
          attachmentId: uploaded.id,
          caption: '',
          alt: '',
          src: documentAttachmentUrl(documentId, uploaded.id),
        },
      })
      .run();
  } catch (err) {
    notifications.show({
      color: 'red',
      title: 'Image upload failed',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}
