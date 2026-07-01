import { Box, Button, Paper, Text } from '@mantine/core';
import { ReactFlow, useEdgesState, useNodesState, type Node } from '@xyflow/react';
import { useCallback, useMemo, useState, type MouseEvent } from 'react';
import '@xyflow/react/dist/style.css';
import { rolesPublicationCopy } from '../../content/siteCopy';
import { getDiagramNodeDetail } from './rolesDiagramDetails';
import { buildRolesDiagramGraph, serializeDiagramNodePositions } from './rolesDiagramLayout';
import { rolesDiagramNodeTypes } from './rolesDiagramNodes';

const ROLE_ORDER = ['lead', 'author', 'member'] as const;

function isDiagramEditMode(): boolean {
  if (!import.meta.env.DEV) return false;
  return new URLSearchParams(window.location.search).get('rolesDiagramEdit') === '1';
}

function DiagramDetailPanel({ selectedNodeId }: { selectedNodeId: string | null }) {
  const detail = selectedNodeId ? getDiagramNodeDetail(selectedNodeId) : null;

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
          {rolesPublicationCopy.diagramClickHint}
        </Text>
      )}
    </Box>
  );
}

function MobileEdgeList() {
  const { roles, document, edges, transition, scope, nodeDescriptions } = rolesPublicationCopy;

  const roleItems = ROLE_ORDER.flatMap((roleId) =>
    edges
      .filter((e) => e.from === roleId)
      .map((edge) => ({
        key: `${edge.from}-${edge.label}`,
        title: roles[roleId],
        description: nodeDescriptions[roleId],
        label: edge.label,
        target: edge.to === 'entwurf' ? document.entwurf : document.version,
      }))
  );

  const docItems = [
    {
      key: 'entwurf',
      title: document.entwurf,
      description: nodeDescriptions.entwurf,
    },
    {
      key: 'transition',
      title: transition,
      description: `${document.entwurf} → ${document.version}`,
    },
    {
      key: 'version',
      title: document.version,
      description: nodeDescriptions.version,
    },
  ];

  return (
    <Box className="landing-roles-diagram-mobile" hiddenFrom="sm">
      <Paper
        className="landing-roles-diagram-scope landing-surface-card"
        p="lg"
        withBorder
        bg="dark.7"
      >
        <Text size="md" tt="uppercase" fw={700} c="gray.2" mb={4} lts={0.6}>
          {scope.title}
        </Text>
        <Text size="md" c="gray.3" mb="xs">
          {scope.hint}
        </Text>
        <Text size="sm" c="gray.4" mb="lg">
          {nodeDescriptions.scope}
        </Text>

        <Text size="sm" tt="uppercase" fw={700} c="gray.3" mb="sm" lts={0.6}>
          Rollen
        </Text>
        <Box component="ul" className="landing-roles-diagram-mobile-list">
          {roleItems.map((item) => (
            <Box component="li" key={item.key}>
              <Text size="md" fw={600}>
                {item.title}
              </Text>
              <Text size="sm" c="gray.4" mt={2}>
                {item.description}
              </Text>
              <Text size="sm" mt={4}>
                <Text span c="gray.3">
                  {item.label}
                </Text>
                {' → '}
                <Text span fw={600}>
                  {item.target}
                </Text>
              </Text>
            </Box>
          ))}
        </Box>

        <Text size="sm" tt="uppercase" fw={700} c="gray.3" mt="lg" mb="sm" lts={0.6}>
          {document.title}
        </Text>
        <Box component="ul" className="landing-roles-diagram-mobile-list">
          {docItems.map((item) => (
            <Box component="li" key={item.key}>
              <Text size="md" fw={600}>
                {item.title}
              </Text>
              <Text size="sm" c="gray.4" mt={2}>
                {item.description}
              </Text>
            </Box>
          ))}
        </Box>
      </Paper>
    </Box>
  );
}

function DiagramEditToolbar({ nodes, onCopied }: { nodes: Node[]; onCopied: () => void }) {
  const copyLayout = useCallback(async () => {
    const json = serializeDiagramNodePositions(nodes);
    await navigator.clipboard.writeText(json);
    onCopied();
  }, [nodes, onCopied]);

  return (
    <Paper className="landing-roles-flow-edit-bar" p="sm" withBorder bg="dark.8">
      <Text size="sm" fw={600}>
        Diagram edit mode
      </Text>
      <Text size="xs" c="dimmed" mt={4}>
        Drag nodes to adjust layout. Frames are fixed; roles and document states move.
      </Text>
      <Button size="xs" variant="light" mt="sm" onClick={() => void copyLayout()}>
        Copy node positions to clipboard
      </Button>
    </Paper>
  );
}

export function RolesDocumentDiagram() {
  const editMode = isDiagramEditMode();
  const initial = useMemo(() => buildRolesDiagramGraph(), []);
  const [nodes, , onNodesChange] = useNodesState(initial.nodes);
  const [edges, , onEdgesChange] = useEdgesState(initial.edges);
  const [copied, setCopied] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const onNodeClick = useCallback(
    (_event: MouseEvent, node: Node) => {
      if (editMode) return;
      setSelectedNodeId((current) => (current === node.id ? null : node.id));
    },
    [editMode]
  );

  const displayNodes = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          selected: !editMode && node.id === selectedNodeId,
        },
        draggable: editMode && !node.id.endsWith('-frame'),
        selectable: editMode,
      })),
    [nodes, editMode, selectedNodeId]
  );

  return (
    <>
      <MobileEdgeList />

      {editMode ? <DiagramEditToolbar nodes={nodes} onCopied={() => setCopied(true)} /> : null}
      {copied ? (
        <Text size="xs" c="green.4" ta="center" mt="xs" visibleFrom="sm">
          Layout copied to clipboard — paste into rolesDiagramLayout.ts
        </Text>
      ) : null}

      <Box className="landing-diagram-desktop landing-roles-diagram-desktop" visibleFrom="sm">
        <Box className="landing-diagram-stage landing-roles-diagram-stage">
          <Box
            className={`landing-roles-flow-wrap${editMode ? ' landing-roles-flow-wrap--edit' : ''}`}
          >
            <ReactFlow
              nodes={displayNodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={onNodeClick}
              nodeTypes={rolesDiagramNodeTypes}
              nodesDraggable={editMode}
              nodesConnectable={false}
              nodesFocusable={editMode}
              edgesFocusable={false}
              elementsSelectable={editMode}
              panOnDrag={editMode}
              zoomOnScroll={editMode}
              zoomOnPinch={editMode}
              zoomOnDoubleClick={false}
              preventScrolling={false}
              proOptions={{ hideAttribution: true }}
              fitView
              fitViewOptions={{ padding: 0.08, maxZoom: 1, minZoom: 0.9 }}
            />
          </Box>

          {!editMode ? <DiagramDetailPanel selectedNodeId={selectedNodeId} /> : null}
        </Box>
      </Box>
    </>
  );
}
