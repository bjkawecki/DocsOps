import { Text } from '@mantine/core';
import { Handle, Position, type NodeProps, type NodeTypes } from '@xyflow/react';
import type { ScopeNodeId } from '../../content/siteCopy';

type ScopeFlowNodeVisual = {
  variant?: 'personal';
  selected?: boolean;
  dimmed?: boolean;
  onPath?: boolean;
};

function nodeClassNames(
  base: string,
  { variant, selected, dimmed, onPath }: ScopeFlowNodeVisual
): string {
  return [
    base,
    variant === 'personal' ? 'landing-scope-flow-node--user' : '',
    selected ? 'landing-scope-node--selected' : '',
    dimmed ? 'landing-scope-node--dimmed' : '',
    onPath ? 'landing-scope-node--path' : '',
  ]
    .filter(Boolean)
    .join(' ');
}

function hasSourceHandle(nodeId: ScopeNodeId): boolean {
  return nodeId === 'company' || nodeId.startsWith('department') || nodeId.startsWith('team');
}

function hasTargetHandle(nodeId: ScopeNodeId): boolean {
  return nodeId !== 'company' && nodeId !== 'userPersonal';
}

export function ScopeFlowNode({ id, data }: NodeProps) {
  const { label, variant, selected, dimmed, onPath } = data as ScopeFlowNodeVisual & {
    label: string;
  };
  const nodeId = id as ScopeNodeId;

  return (
    <button
      type="button"
      className={nodeClassNames('landing-scope-flow-node', { variant, selected, dimmed, onPath })}
      aria-pressed={selected ?? false}
    >
      {hasTargetHandle(nodeId) ? (
        <Handle
          type="target"
          position={Position.Top}
          className="landing-scope-flow-handle"
          isConnectable={false}
        />
      ) : null}
      {hasSourceHandle(nodeId) ? (
        <Handle
          type="source"
          position={Position.Bottom}
          className="landing-scope-flow-handle"
          isConnectable={false}
        />
      ) : null}
      <Text component="span" className="landing-scope-node-label" fw={600} size="lg">
        {label}
      </Text>
    </button>
  );
}

export const scopeDiagramNodeTypes: NodeTypes = {
  scopeNode: ScopeFlowNode,
};
