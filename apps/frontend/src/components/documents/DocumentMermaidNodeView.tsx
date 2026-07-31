import { ActionIcon, Tooltip } from '@mantine/core';
import { IconX } from '@tabler/icons-react';
import { NodeViewContent, NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import classes from './DocumentMermaid.module.css';

/** Editor chrome: Mermaid source only (reader renders the diagram). */
export function DocumentMermaidNodeView({ editor, deleteNode }: NodeViewProps) {
  const editable = editor.isEditable;

  return (
    <NodeViewWrapper as="div" className={classes.editorRoot} data-mermaid="">
      <div className={classes.editorHeader} contentEditable={false}>
        <span className={classes.editorLabel}>Mermaid</span>
        {editable ? (
          <Tooltip label="Remove diagram" withArrow position="left">
            <ActionIcon
              className={classes.editorRemove}
              variant="subtle"
              color="gray"
              size="sm"
              radius="xl"
              aria-label="Remove diagram"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                deleteNode();
              }}
            >
              <IconX size={14} stroke={2} />
            </ActionIcon>
          </Tooltip>
        ) : null}
      </div>
      <pre className={classes.editorPre}>
        <NodeViewContent as="code" className={classes.editorCode} />
      </pre>
    </NodeViewWrapper>
  );
}
