import { ActionIcon, TextInput, Tooltip } from '@mantine/core';
import { IconX } from '@tabler/icons-react';
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { formatFigureCaption } from '../../lib/figureCaption.js';

function figureIndexInDoc(editor: NodeViewProps['editor'], pos: number): number {
  let index = 0;
  editor.state.doc.forEach((node, offset) => {
    if (node.type.name !== 'image') return;
    if (offset <= pos) index += 1;
  });
  return Math.max(1, index);
}

export function DocumentImageNodeView({
  node,
  updateAttributes,
  editor,
  getPos,
  deleteNode,
}: NodeViewProps) {
  const src = typeof node.attrs.src === 'string' ? node.attrs.src : '';
  const caption = typeof node.attrs.caption === 'string' ? node.attrs.caption : '';
  const alt = typeof node.attrs.alt === 'string' ? node.attrs.alt : '';
  const pos = typeof getPos === 'function' ? getPos() : null;
  const figureN = typeof pos === 'number' ? figureIndexInDoc(editor, pos) : 1;
  const label = formatFigureCaption(figureN, caption);
  const editable = editor.isEditable;

  return (
    <NodeViewWrapper className="document-image-node" data-drag-handle>
      <div className="document-image-node__media">
        {src ? (
          <img src={src} alt={alt || label} className="document-image-node__img" />
        ) : (
          <div className="document-image-node__placeholder">Image unavailable</div>
        )}
        {editable ? (
          <Tooltip label="Remove image" withArrow position="left">
            <ActionIcon
              className="document-image-node__remove"
              variant="filled"
              color="dark"
              size="sm"
              radius="xl"
              aria-label="Remove image"
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
      <figcaption className="document-image-node__caption-label">{label}</figcaption>
      {editable ? (
        <TextInput
          size="xs"
          placeholder="Caption (optional)"
          value={caption}
          onChange={(e) => updateAttributes({ caption: e.currentTarget.value })}
          className="document-image-node__caption-input"
        />
      ) : null}
    </NodeViewWrapper>
  );
}
