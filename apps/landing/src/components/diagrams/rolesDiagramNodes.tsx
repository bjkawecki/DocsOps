import { Box, Paper, Text } from '@mantine/core';
import { Handle, Position, type NodeProps, type NodeTypes } from '@xyflow/react';

type ScopeFrameNodeData = {
  title: string;
  hint: string;
  selected?: boolean;
};

export function ScopeFrameNode({ data }: NodeProps) {
  const { title, hint, selected } = data as ScopeFrameNodeData;
  return (
    <Box
      className={`landing-roles-flow-frame landing-roles-flow-scope-frame landing-surface-card${selected ? ' landing-roles-flow-node--selected' : ''}`}
      style={{ width: '100%', height: '100%' }}
    >
      <Text size="md" tt="uppercase" fw={700} c="gray.2" lts={0.6}>
        {title}
      </Text>
      <Text size="md" c="gray.3" mt={8} mb={4} className="landing-roles-flow-scope-frame-hint">
        {hint}
      </Text>
    </Box>
  );
}

type DocumentFrameNodeData = {
  title: string;
  selected?: boolean;
};

export function DocumentFrameNode({ data }: NodeProps) {
  const { title, selected } = data as DocumentFrameNodeData;
  return (
    <Box
      className={`landing-roles-flow-frame landing-roles-flow-document-frame${selected ? ' landing-roles-flow-node--selected' : ''}`}
      style={{ width: '100%', height: '100%' }}
    >
      <Text size="md" tt="uppercase" fw={700} c="gray.2" lts={0.6}>
        {title}
      </Text>
    </Box>
  );
}

type SideHandleDef = {
  id: string;
  topPercent: number;
};

type RoleNodeData = {
  label: string;
  selected?: boolean;
  sourceHandles: SideHandleDef[];
};

export function RoleFlowNode({ data }: NodeProps) {
  const { label, selected, sourceHandles } = data as RoleNodeData;
  return (
    <Paper
      className={`landing-roles-flow-node${selected ? ' landing-roles-flow-node--selected' : ''}`}
      px="xl"
      py="md"
      withBorder
      bg="dark.8"
    >
      {sourceHandles.map((handle) => (
        <Handle
          key={handle.id}
          id={handle.id}
          type="source"
          position={Position.Right}
          className="landing-roles-flow-handle"
          style={{ top: `${handle.topPercent}%` }}
          isConnectable={false}
        />
      ))}
      <Text fw={600} size="lg" c="gray.0">
        {label}
      </Text>
    </Paper>
  );
}

type DocStateNodeData = {
  label: string;
  selected?: boolean;
  targetHandlesLeft?: SideHandleDef[];
  targetHandleTopId?: string;
  sourceHandleBottomId?: string;
};

export function DocStateFlowNode({ data }: NodeProps) {
  const { label, selected, targetHandlesLeft, targetHandleTopId, sourceHandleBottomId } =
    data as DocStateNodeData;

  return (
    <Paper
      className={`landing-roles-flow-node landing-roles-flow-doc-state-node${selected ? ' landing-roles-flow-node--selected' : ''}`}
      px="xl"
      py="md"
      withBorder
      bg="dark.8"
      w="100%"
    >
      {targetHandleTopId ? (
        <Handle
          type="target"
          position={Position.Top}
          id={targetHandleTopId}
          className="landing-roles-flow-handle"
          isConnectable={false}
        />
      ) : null}
      {targetHandlesLeft?.map((handle) => (
        <Handle
          key={handle.id}
          id={handle.id}
          type="target"
          position={Position.Left}
          className="landing-roles-flow-handle"
          style={{ top: `${handle.topPercent}%` }}
          isConnectable={false}
        />
      ))}
      {sourceHandleBottomId ? (
        <Handle
          type="source"
          position={Position.Bottom}
          id={sourceHandleBottomId}
          className="landing-roles-flow-handle"
          isConnectable={false}
        />
      ) : null}
      <Text fw={600} size="lg" c="gray.0">
        {label}
      </Text>
    </Paper>
  );
}

export const rolesDiagramNodeTypes = {
  scopeFrame: ScopeFrameNode,
  documentFrame: DocumentFrameNode,
  roleNode: RoleFlowNode,
  docStateNode: DocStateFlowNode,
} satisfies NodeTypes;
