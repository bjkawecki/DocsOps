import type { Edge, Node } from '@xyflow/react';
import { MarkerType } from '@xyflow/react';
import type { ScopeNodeId } from '../../content/types';

const NODE_WIDTH = 152;

const POSITIONS = {
  company: { x: 304, y: 0 },
  departmentA: { x: 80, y: 104 },
  departmentB: { x: 528, y: 104 },
  teamA1: { x: 0, y: 208 },
  teamA2: { x: 184, y: 208 },
  teamB1: { x: 448, y: 208 },
  teamB2: { x: 632, y: 208 },
  userPersonal: { x: 316, y: 312 },
} as const;

const edgeStyle = { stroke: 'var(--mantine-color-dark-3)', strokeWidth: 2 };
const markerEnd = {
  type: MarkerType.ArrowClosed,
  width: 18,
  height: 18,
  color: 'var(--mantine-color-blue-4)',
};

type ScopeNodeData = {
  label: string;
  variant?: 'personal';
  selected?: boolean;
  dimmed?: boolean;
  onPath?: boolean;
};

type ScopeNodesCopy = Record<ScopeNodeId, { label: string }>;

function scopeNode(id: ScopeNodeId, nodes: ScopeNodesCopy): Node<ScopeNodeData> {
  const variant = id === 'userPersonal' ? 'personal' : undefined;
  return {
    id,
    type: 'scopeNode',
    position: POSITIONS[id],
    data: { label: nodes[id].label, variant },
    style: { width: NODE_WIDTH },
    draggable: false,
    selectable: false,
    focusable: false,
  };
}

function treeEdge(source: ScopeNodeId, target: ScopeNodeId): Edge {
  return {
    id: `${source}-${target}`,
    source,
    target,
    type: 'smoothstep',
    style: edgeStyle,
    markerEnd,
    selectable: false,
    focusable: false,
  };
}

export function buildScopeDiagramGraph(nodesCopy: ScopeNodesCopy): {
  nodes: Node[];
  edges: Edge[];
} {
  return {
    nodes: [
      scopeNode('company', nodesCopy),
      scopeNode('departmentA', nodesCopy),
      scopeNode('departmentB', nodesCopy),
      scopeNode('teamA1', nodesCopy),
      scopeNode('teamA2', nodesCopy),
      scopeNode('teamB1', nodesCopy),
      scopeNode('teamB2', nodesCopy),
      scopeNode('userPersonal', nodesCopy),
    ],
    edges: [
      treeEdge('company', 'departmentA'),
      treeEdge('company', 'departmentB'),
      treeEdge('departmentA', 'teamA1'),
      treeEdge('departmentA', 'teamA2'),
      treeEdge('departmentB', 'teamB1'),
      treeEdge('departmentB', 'teamB2'),
    ],
  };
}
