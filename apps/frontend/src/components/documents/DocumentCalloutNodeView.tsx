import { NodeViewContent, NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import {
  CALLOUT_VARIANT_LABELS,
  isCalloutVariant,
  type CalloutVariant,
} from '../../lib/calloutVariant.js';
import classes from './DocumentCallout.module.css';

export function DocumentCalloutNodeView({ node }: NodeViewProps) {
  const variant: CalloutVariant = isCalloutVariant(node.attrs.variant)
    ? node.attrs.variant
    : 'info';
  const label = CALLOUT_VARIANT_LABELS[variant];

  return (
    <NodeViewWrapper as="aside" className={classes.root} data-callout="" data-variant={variant}>
      <div className={classes.label} contentEditable={false}>
        {label}
      </div>
      <NodeViewContent className={classes.content} />
    </NodeViewWrapper>
  );
}
