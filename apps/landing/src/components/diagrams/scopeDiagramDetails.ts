import { scopeCopy, type ScopeLevelId, type ScopeNodeId } from '../../content/siteCopy';

export type ScopeNodeDetail = {
  title: string;
  description: string;
};

const NODE_LEVEL: Record<ScopeNodeId, ScopeLevelId> = {
  company: 'company',
  departmentA: 'department',
  departmentB: 'department',
  teamA1: 'team',
  teamA2: 'team',
  teamB1: 'team',
  teamB2: 'team',
  userPersonal: 'user',
};

const DEPARTMENT_FOR_TEAM: Record<'teamA1' | 'teamA2' | 'teamB1' | 'teamB2', ScopeNodeId> = {
  teamA1: 'departmentA',
  teamA2: 'departmentA',
  teamB1: 'departmentB',
  teamB2: 'departmentB',
};

function edgeId(source: ScopeNodeId, target: ScopeNodeId): string {
  return `${source}-${target}`;
}

export type ScopeHighlightState = {
  pathNodes: ReadonlySet<ScopeNodeId>;
  pathEdgeIds: ReadonlySet<string>;
};

export function getScopeHighlightState(selectedNodeId: ScopeNodeId | null): ScopeHighlightState {
  if (!selectedNodeId) {
    return { pathNodes: new Set(), pathEdgeIds: new Set() };
  }

  const pathNodes: ScopeNodeId[] = [];
  const pathEdgeIds: string[] = [];

  switch (selectedNodeId) {
    case 'company':
      pathNodes.push('company');
      break;
    case 'departmentA':
    case 'departmentB':
      pathNodes.push(selectedNodeId, 'company');
      pathEdgeIds.push(edgeId('company', selectedNodeId));
      break;
    case 'teamA1':
    case 'teamA2':
    case 'teamB1':
    case 'teamB2': {
      const department = DEPARTMENT_FOR_TEAM[selectedNodeId];
      pathNodes.push(selectedNodeId, department, 'company');
      pathEdgeIds.push(edgeId(department, selectedNodeId), edgeId('company', department));
      break;
    }
    case 'userPersonal':
      pathNodes.push('userPersonal');
      break;
    default:
      break;
  }

  return { pathNodes: new Set(pathNodes), pathEdgeIds: new Set(pathEdgeIds) };
}

export function getScopeNodeDetail(nodeId: ScopeNodeId): ScopeNodeDetail {
  const { nodes, levelDescriptions } = scopeCopy;
  const level = NODE_LEVEL[nodeId];

  return {
    title: nodes[nodeId].label,
    description: levelDescriptions[level],
  };
}

export function resolveScopeNodeVisualState(
  nodeId: ScopeNodeId,
  selectedNodeId: ScopeNodeId | null
): { selected: boolean; dimmed: boolean; onPath: boolean } {
  if (!selectedNodeId) {
    return { selected: false, dimmed: false, onPath: false };
  }

  const { pathNodes } = getScopeHighlightState(selectedNodeId);

  if (nodeId === selectedNodeId) {
    return { selected: true, dimmed: false, onPath: false };
  }

  if (pathNodes.has(nodeId)) {
    return { selected: false, dimmed: false, onPath: true };
  }

  return { selected: false, dimmed: true, onPath: false };
}
