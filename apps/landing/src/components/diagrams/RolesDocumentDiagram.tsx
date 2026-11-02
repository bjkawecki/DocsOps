import { Box, Button, Group, Paper, Stack, Text, ThemeIcon } from '@mantine/core';
import {
  IconCircleCheck,
  IconEye,
  IconFileText,
  IconPencil,
  IconShieldCheck,
  type Icon,
} from '@tabler/icons-react';
import { ReactFlow, useEdgesState, useNodesState, type Node } from '@xyflow/react';
import { useCallback, useMemo, useState, type MouseEvent } from 'react';
import '@xyflow/react/dist/style.css';
import { rolesPublicationCopy } from '../../content/siteCopy';
import { getDiagramNodeDetail } from './rolesDiagramDetails';
import { buildRolesDiagramGraph, serializeDiagramNodePositions } from './rolesDiagramLayout';
import { rolesDiagramNodeTypes } from './rolesDiagramNodes';

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

type MobileRoleLevel = {
  title: string;
  description: string;
  Icon: Icon;
};

const MOBILE_ROLE_LEVELS: MobileRoleLevel[] = [
  {
    title: rolesPublicationCopy.roles.lead,
    description: 'Qualität und Freigabe; veröffentlicht die verbindliche Version.',
    Icon: IconShieldCheck,
  },
  {
    title: rolesPublicationCopy.roles.author,
    description: 'Formuliert inhaltliche Vorschläge im Entwurf.',
    Icon: IconPencil,
  },
  {
    title: rolesPublicationCopy.roles.member,
    description: 'Liest die veröffentlichte Version und kann kommentieren.',
    Icon: IconEye,
  },
  {
    title: rolesPublicationCopy.document.entwurf,
    description: 'Arbeitsfassung: Änderungen werden vorbereitet und zusammengeführt.',
    Icon: IconFileText,
  },
  {
    title: 'Veröffentlichte Version',
    description: 'Verbindliche Fassung für alle mit Leserecht.',
    Icon: IconCircleCheck,
  },
];

function MobileRolesList() {
  return (
    <Box className="landing-roles-diagram-mobile" hiddenFrom="sm">
      <Paper
        className="landing-roles-diagram-scope landing-surface-card"
        p="lg"
        withBorder
        bg="dark.7"
      >
        <Text size="sm" c="gray.3" lh={1.55} mb="md">
          Mitwirken und Freigabe sind getrennt: vom Entwurf bis zur verbindlichen Version.
        </Text>
        <Box component="ol" className="landing-roles-diagram-mobile-list">
          {MOBILE_ROLE_LEVELS.map(({ title, description, Icon }) => (
            <Box component="li" key={title}>
              <Group align="flex-start" gap="sm" wrap="nowrap">
                <ThemeIcon variant="light" color="blue" radius="xl" size={30} mt={2}>
                  <Icon size={18} stroke={1.8} />
                </ThemeIcon>
                <Stack gap={2}>
                  <Text size="md" fw={600} lh={1.35}>
                    {title}
                  </Text>
                  <Text size="sm" c="gray.4" lh={1.55}>
                    {description}
                  </Text>
                </Stack>
              </Group>
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
      <MobileRolesList />

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
