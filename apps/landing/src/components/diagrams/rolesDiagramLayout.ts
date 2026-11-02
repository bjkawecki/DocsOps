import type { Edge, Node } from '@xyflow/react';
import { MarkerType } from '@xyflow/react';
import { rolesPublicationCopy } from '../../content/siteCopy';

const ROLE_NODE_IDS = {
  lead: 'lead',
  author: 'author',
  member: 'member',
} as const;

const DOC_NODE_IDS = {
  entwurf: 'entwurf',
  version: 'version',
} as const;

const SOURCE_HANDLES = {
  lead: 'lead-out',
  author: 'author-out',
  member: 'member-out',
} as const;

const TARGET_HANDLES = {
  entwurf: {
    lead: 'entwurf-in-lead',
    author: 'entwurf-in-author',
  },
  version: {
    member: 'version-in-member',
  },
} as const;

/** Approximate rendered width of state/role nodes (px) for centering in frames. */
const STATE_NODE_WIDTH = 164;

/** Approximate rendered height of role nodes (px) for vertical alignment. */
const ROLE_NODE_APPROX_HEIGHT = 56;

const LAYOUT = {
  scope: { width: 940, height: 560 },
  documentFrame: { x: 536, width: 328, height: 380 },
  roles: { x: 80, leadY: 118, authorY: 278, memberY: 438 },
} as const;

function roleNodeCenterY(roleY: number): number {
  return roleY + ROLE_NODE_APPROX_HEIGHT / 2;
}

function documentFrameY(): number {
  return roleNodeCenterY(LAYOUT.roles.authorY) - LAYOUT.documentFrame.height / 2;
}

function centeredStateX(frameX: number, frameWidth: number): number {
  return frameX + (frameWidth - STATE_NODE_WIDTH) / 2;
}

export function buildRolesDiagramGraph(): { nodes: Node[]; edges: Edge[] } {
  const { roles, document, edges, transition, scope } = rolesPublicationCopy;
  const docFrameY = documentFrameY();
  const stateX = centeredStateX(LAYOUT.documentFrame.x, LAYOUT.documentFrame.width);
  const entwurfY = docFrameY + 96;
  const versionY = docFrameY + 288;

  const nodes: Node[] = [
    {
      id: 'scope-frame',
      type: 'scopeFrame',
      position: { x: 0, y: 0 },
      data: { title: scope.title, hint: scope.hint },
      style: { width: LAYOUT.scope.width, height: LAYOUT.scope.height },
      zIndex: -2,
      draggable: false,
      selectable: false,
      focusable: false,
    },
    {
      id: 'document-frame',
      type: 'documentFrame',
      position: { x: LAYOUT.documentFrame.x, y: docFrameY },
      data: { title: document.title },
      style: { width: LAYOUT.documentFrame.width, height: LAYOUT.documentFrame.height },
      zIndex: -1,
      draggable: false,
      selectable: false,
      focusable: false,
    },
    {
      id: ROLE_NODE_IDS.lead,
      type: 'roleNode',
      position: { x: LAYOUT.roles.x, y: LAYOUT.roles.leadY },
      data: {
        label: roles.lead,
        sourceHandles: [{ id: SOURCE_HANDLES.lead, topPercent: 50 }],
      },
      draggable: false,
      selectable: false,
      focusable: false,
    },
    {
      id: ROLE_NODE_IDS.author,
      type: 'roleNode',
      position: { x: LAYOUT.roles.x, y: LAYOUT.roles.authorY },
      data: {
        label: roles.author,
        sourceHandles: [{ id: SOURCE_HANDLES.author, topPercent: 50 }],
      },
      draggable: false,
      selectable: false,
      focusable: false,
    },
    {
      id: ROLE_NODE_IDS.member,
      type: 'roleNode',
      position: { x: LAYOUT.roles.x, y: LAYOUT.roles.memberY },
      data: {
        label: roles.member,
        sourceHandles: [{ id: SOURCE_HANDLES.member, topPercent: 50 }],
      },
      draggable: false,
      selectable: false,
      focusable: false,
    },
    {
      id: DOC_NODE_IDS.entwurf,
      type: 'docStateNode',
      position: { x: stateX, y: entwurfY },
      style: { width: STATE_NODE_WIDTH },
      data: {
        label: document.entwurf,
        sourceHandleBottomId: 'entwurf-out',
        targetHandlesLeft: [
          { id: TARGET_HANDLES.entwurf.lead, topPercent: 35 },
          { id: TARGET_HANDLES.entwurf.author, topPercent: 65 },
        ],
      },
      draggable: false,
      selectable: false,
      focusable: false,
    },
    {
      id: DOC_NODE_IDS.version,
      type: 'docStateNode',
      position: { x: stateX, y: versionY },
      style: { width: STATE_NODE_WIDTH },
      data: {
        label: document.version,
        targetHandleTopId: 'version-in-top',
        targetHandlesLeft: [{ id: TARGET_HANDLES.version.member, topPercent: 50 }],
      },
      draggable: false,
      selectable: false,
      focusable: false,
    },
  ];

  const edgeStyle = { stroke: 'var(--mantine-color-dark-3)', strokeWidth: 2 };
  const markerEnd = {
    type: MarkerType.ArrowClosed,
    width: 18,
    height: 18,
    color: 'var(--mantine-color-blue-4)',
  };
  const edgeLabelStyle = { fill: '#f1f3f5', fontSize: 15, fontWeight: 600 };
  const edgeLabelBgStyle = { fill: '#25262b', fillOpacity: 0.98 };

  const flowEdges: Edge[] = edges.map((edge) => ({
    id: `role-edge-${edge.from}-${edge.to}`,
    source: ROLE_NODE_IDS[edge.from],
    target: DOC_NODE_IDS[edge.to],
    sourceHandle: SOURCE_HANDLES[edge.from],
    targetHandle:
      edge.to === 'entwurf' ? TARGET_HANDLES.entwurf[edge.from] : TARGET_HANDLES.version.member,
    label: edge.label,
    type: 'default',
    style: edgeStyle,
    markerEnd,
    selectable: false,
    focusable: false,
    labelShowBg: true,
    labelStyle: edgeLabelStyle,
    labelBgStyle: edgeLabelBgStyle,
    labelBgPadding: [10, 7] as [number, number],
    labelBgBorderRadius: 6,
  }));

  flowEdges.push({
    id: 'doc-transition',
    source: DOC_NODE_IDS.entwurf,
    target: DOC_NODE_IDS.version,
    sourceHandle: 'entwurf-out',
    targetHandle: 'version-in-top',
    label: transition,
    type: 'straight',
    style: edgeStyle,
    markerEnd,
    selectable: false,
    focusable: false,
    labelShowBg: true,
    labelStyle: edgeLabelStyle,
    labelBgStyle: edgeLabelBgStyle,
    labelBgPadding: [10, 7] as [number, number],
    labelBgBorderRadius: 6,
  });

  return { nodes, edges: flowEdges };
}

/** Layout-Export nach manuellem Verschieben im Dev-Editor (?rolesDiagramEdit=1). */
export function serializeDiagramNodePositions(nodes: Node[]): string {
  return JSON.stringify(
    nodes.map((node) => ({
      id: node.id,
      type: node.type,
      position: node.position,
      style: node.style,
      data: node.data,
    })),
    null,
    2
  );
}
