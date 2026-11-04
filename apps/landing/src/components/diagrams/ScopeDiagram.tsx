import { Box, Group, Paper, Stack, Text, ThemeIcon } from '@mantine/core';
import {
  IconBuilding,
  IconHierarchy2,
  IconUser,
  IconUsersGroup,
  type Icon,
} from '@tabler/icons-react';
import {
  ReactFlow,
  useEdgesState,
  useNodesState,
  MarkerType,
  type Edge,
  type Node,
} from '@xyflow/react';
import { useCallback, useEffect, useMemo, useState, type MouseEvent } from 'react';
import '@xyflow/react/dist/style.css';
import { useLandingCopy } from '../../content/useLandingCopy';
import type { ScopeNodeId } from '../../content/types';
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
  stroke: 'var(--landing-diagram-stroke-dim)',
  strokeWidth: 2,
  opacity: 0.35,
};
const FOCUSED_MARKER = {
  type: MarkerType.ArrowClosed,
  width: 18,
  height: 18,
  color: 'var(--mantine-color-blue-4)',
};

const MOBILE_ICONS: Icon[] = [IconBuilding, IconHierarchy2, IconUsersGroup, IconUser];

function DiagramDetailPanel({ selectedNodeId }: { selectedNodeId: ScopeNodeId | null }) {
  const { site } = useLandingCopy();
  const { scopeCopy } = site;
  const detail = selectedNodeId ? getScopeNodeDetail(selectedNodeId, scopeCopy) : null;

  return (
    <Box className="landing-diagram-detail-panel">
      {detail ? (
        <>
          <Text size="sm" tt="uppercase" fw={700} c="dimmed" lts={0.6} mb="sm">
            {detail.title}
          </Text>
          {detail.description.split(/\n\n+/).map((paragraph, index) => (
            <Text key={index} size="md" c="dimmed" lh={1.65} mb={index === 0 ? 'sm' : 0}>
              {paragraph}
            </Text>
          ))}
        </>
      ) : (
        <Text size="md" c="dimmed" lh={1.65}>
          {scopeCopy.diagramClickHint}
        </Text>
      )}
    </Box>
  );
}

function MobileScopeList() {
  const { site } = useLandingCopy();
  const { scopeCopy } = site;

  return (
    <Box className="landing-scope-mobile" hiddenFrom="sm">
      <Paper
        className="landing-scope-mobile-card landing-surface-card"
        p="lg"
        withBorder
        style={{ backgroundColor: 'var(--landing-surface-2)' }}
      >
        <Text size="sm" c="dimmed" lh={1.55} mb="md">
          {scopeCopy.mobileIntro}
        </Text>
        <Box component="ol" className="landing-scope-mobile-list">
          {scopeCopy.mobileLevels.map(({ title, description }, index) => {
            const Icon = MOBILE_ICONS[index] ?? IconBuilding;
            return (
              <Box component="li" key={title}>
                <Group align="flex-start" gap="sm" wrap="nowrap">
                  <ThemeIcon variant="light" color="blue" radius="xl" size={30} mt={2}>
                    <Icon size={18} stroke={1.8} />
                  </ThemeIcon>
                  <Stack gap={2}>
                    <Text size="md" fw={600} lh={1.35}>
                      {title}
                    </Text>
                    <Text size="sm" c="dimmed" lh={1.55}>
                      {description}
                    </Text>
                  </Stack>
                </Group>
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
      ? { ...FOCUSED_MARKER, color: 'var(--landing-diagram-stroke-dim)' }
      : undefined,
  };
}

export function ScopeDiagram() {
  const { site } = useLandingCopy();
  const { scopeCopy } = site;
  const initial = useMemo(() => buildScopeDiagramGraph(scopeCopy.nodes), [scopeCopy.nodes]);
  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges);
  const [selectedNodeId, setSelectedNodeId] = useState<ScopeNodeId | null>(null);

  useEffect(() => {
    setNodes(initial.nodes);
    setEdges(initial.edges);
    setSelectedNodeId(null);
  }, [initial, setNodes, setEdges]);

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
            style={{ backgroundColor: 'var(--landing-surface-2)' }}
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
