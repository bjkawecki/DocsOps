import { Node, mergeAttributes, type CommandProps } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { DocumentCalloutNodeView } from '../components/documents/DocumentCalloutNodeView.js';
import { isCalloutVariant, type CalloutVariant } from '../lib/calloutVariant.js';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    callout: {
      setCallout: (attrs?: { variant?: CalloutVariant }) => ReturnType;
      toggleCallout: (attrs?: { variant?: CalloutVariant }) => ReturnType;
      updateCalloutVariant: (variant: CalloutVariant) => ReturnType;
    };
  }
}

/**
 * Callout block (§28a): container for block+ content with variant info|warning|tip.
 */
export const DocumentCallout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+',
  defining: true,
  isolating: true,

  addAttributes() {
    return {
      blockId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-block-id'),
        renderHTML: (attributes) => {
          const id = attributes.blockId as string | null | undefined;
          if (!id) return {};
          return { 'data-block-id': id };
        },
      },
      variant: {
        default: 'info' as CalloutVariant,
        parseHTML: (element) => {
          const raw = element.getAttribute('data-variant');
          return isCalloutVariant(raw) ? raw : 'info';
        },
        renderHTML: (attributes) => {
          const variant = isCalloutVariant(attributes.variant) ? attributes.variant : 'info';
          return { 'data-variant': variant };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'aside[data-callout]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['aside', mergeAttributes({ 'data-callout': '' }, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setCallout:
        (attrs) =>
        ({ commands }: CommandProps) =>
          commands.wrapIn(this.name, {
            variant: isCalloutVariant(attrs?.variant) ? attrs.variant : 'info',
          }),
      toggleCallout:
        (attrs) =>
        ({ commands }: CommandProps) =>
          commands.toggleWrap(this.name, {
            variant: isCalloutVariant(attrs?.variant) ? attrs.variant : 'info',
          }),
      updateCalloutVariant:
        (variant) =>
        ({ commands }: CommandProps) => {
          if (!isCalloutVariant(variant)) return false;
          return commands.updateAttributes(this.name, { variant });
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(DocumentCalloutNodeView);
  },
});
