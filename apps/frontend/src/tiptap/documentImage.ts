import Image from '@tiptap/extension-image';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { DocumentImageNodeView } from '../components/documents/DocumentImageNodeView.js';

/**
 * Block image (§28a): atom node with attachmentId + optional caption/alt.
 * `src` is display-only (API proxy URL); persistence uses attachmentId.
 */
export const DocumentImage = Image.extend({
  name: 'image',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      ...this.parent?.(),
      blockId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-block-id'),
        renderHTML: (attributes) => {
          const id = attributes.blockId as string | null | undefined;
          if (!id) return {};
          return { 'data-block-id': id };
        },
      },
      attachmentId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-attachment-id'),
        renderHTML: (attributes) => {
          const id = attributes.attachmentId as string | null | undefined;
          if (!id) return {};
          return { 'data-attachment-id': id };
        },
      },
      caption: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-caption') ?? '',
        renderHTML: (attributes) => {
          const caption = attributes.caption as string | null | undefined;
          if (!caption) return {};
          return { 'data-caption': caption };
        },
      },
      alt: {
        default: '',
      },
      src: {
        default: null,
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(DocumentImageNodeView);
  },
});
