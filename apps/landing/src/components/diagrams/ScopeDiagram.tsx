import { Box, Paper, Text } from '@mantine/core';
import {
  ReactFlow,
  useEdgesState,
  useNodesState,
  MarkerType,
  type Edge,
  type Node,
} from '@xyflow/react';
import { useCallback, useMemo, useState, type MouseEvent } from 'react';
import '@xyflow/react/dist/style.css';
import { scopeCopy, type ScopeNodeId } from '../../content/siteCopy';
import {
  getScopeHighlightState,
  getScopeNodeDetail,
  resolveScopeNodeVisualState,
} from './scopeDiagramDetails';
import { buildScopeDiagramGraph } from './scopeDiagramLayout';
import { scopeDiagramNodeTypes } from './scopeDiagramNodes';

const FOCUSED_EDGE_STYLE = {
  stroke: 'var(--mantine-color-blue-4)',
  strokeWidth: 2.5,
};
const DIMMED_EDGE_STYLE = {
  stroke: 'var(--mantine-color-dark-5)',
  strokeWidth: 2,
  opacity: 0.35,
};
const FOCUSED_MARKER = {
  type: MarkerType.ArrowClosed,
  width: 18,
  height: 18,
  color: 'var(--mantine-color-blue-4)',
};

function DiagramDetailPanel({ selectedNodeId }: { selectedNodeId: ScopeNodeId | null }) {
  const detail = selectedNodeId ? getScopeNodeDetail(selectedNodeId) : null;

  return (
    <Box className="landing-diagram-detail-panel">
      {detail ? (
        <>
          <Text size="sm" tt="uppercase" fw={700} c="gray.3" lts={0.6} mb="sm">
            {detail.title}
          </Text>
          <Text size="md" c="gray.2" lh={1.65}>
            {detail.description}
          </Text>
        </>
      ) : (
        <Text size="md" c="gray.4" lh={1.65}>
          {scopeCopy.diagramClickHint}
        </Text>
      )}
    </Box>
  );
}

const MOBILE_NODES: ScopeNodeId[] = [
  'company',
  'departmentA',
  'teamA1',
  'teamA2',
  'departmentB',
  'teamB1',
  'teamB2',
  'userPersonal',
];

function MobileScopeList() {
  return (
    <Box className="landing-scope-mobile" hiddenFrom="sm">
      <Paper
        className="landing-scope-mobile-card landing-surface-card"
        p="lg"
        withBorder
        bg="dark.7"
      >
        <Box component="ol" className="landing-scope-mobile-list">
          {MOBILE_NODES.map((nodeId) => {
            const detail = getScopeNodeDetail(nodeId);
            return (
              <Box component="li" key={nodeId}>
                <Text size="md" fw={600}>
                  {detail.title}
                </Text>
                <Text size="sm" c="gray.4" mt={4} lh={1.6}>
                  {detail.description}
                </Text>
              </Box>
            );
          })}
        </Box>
      </Paper>
    </Box>
  );
}

function resolveEdgeVisualState(
  edge: Edge,
  selectedNodeId: ScopeNodeId | null
): { style: Edge['style']; markerEnd: Edge['markerEnd'] } {
  if (!selectedNodeId) {
    return { style: edge.style, markerEnd: edge.markerEnd };
  }

  const { pathEdgeIds } = getScopeHighlightState(selectedNodeId);
  const onPath = pathEdgeIds.has(edge.id);

  if (onPath) {
    return {
      style: { ...edge.style, ...FOCUSED_EDGE_STYLE },
      markerEnd: edge.markerEnd ? FOCUSED_MARKER : undefined,
    };
  }

  return {
    style: { ...edge.style, ...DIMMED_EDGE_STYLE },
    markerEnd: edge.markerEnd
      ? { ...FOCUSED_MARKER, color: 'var(--mantine-color-dark-5)' }
      : undefined,
  };
}

export function ScopeDiagram() {
  const initial = useMemo(() => buildScopeDiagramGraph(), []);
  const [nodes, , onNodesChange] = useNodesState(initial.nodes);
  const [edges, , onEdgesChange] = useEdgesState(initial.edges);
  const [selectedNodeId, setSelectedNodeId] = useState<ScopeNodeId | null>(null);

  const onNodeClick = useCallback((_event: MouseEvent, node: Node) => {
    setSelectedNodeId((current) => (current === node.id ? null : (node.id as ScopeNodeId)));
  }, []);

  const displayNodes = useMemo(
    () =>
      nodes.map((node) => {
        const visual = resolveScopeNodeVisualState(node.id as ScopeNodeId, selectedNodeId);
        return {
          ...node,
          data: {
            ...node.data,
            ...visual,
          },
        };
      }),
    [nodes, selectedNodeId]
  );

  const displayEdges = useMemo(
    () =>
      edges.map((edge) => {
        const visual = resolveEdgeVisualState(edge, selectedNodeId);
        return {
          ...edge,
          style: visual.style,
          markerEnd: visual.markerEnd,
        };
      }),
    [edges, selectedNodeId]
  );

  return (
    <>
      <MobileScopeList />

      <Box className="landing-diagram-desktop landing-scope-diagram-desktop" visibleFrom="sm">
        <Box className="landing-diagram-stage landing-scope-diagram-stage">
          <Paper
            className="landing-scope-diagram-card landing-surface-card"
            p="xl"
            withBorder
            bg="dark.7"
          >
            <Box className="landing-scope-flow-wrap">
              <ReactFlow
                nodes={displayNodes}
                edges={displayEdges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={onNodeClick}
                nodeTypes={scopeDiagramNodeTypes}
                nodesDraggable={false}
                nodesConnectable={false}
                nodesFocusable={false}
                edgesFocusable={false}
                elementsSelectable={false}
                panOnDrag={false}
                zoomOnScroll={false}
                zoomOnPinch={false}
                zoomOnDoubleClick={false}
                preventScrolling={false}
                proOptions={{ hideAttribution: true }}
                fitView
                fitViewOptions={{ padding: 0.06, maxZoom: 1, minZoom: 0.85 }}
              />
            </Box>
          </Paper>

          <DiagramDetailPanel selectedNodeId={selectedNodeId} />
        </Box>
      </Box>
    </>
  );
}
