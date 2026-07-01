import { rolesPublicationCopy } from '../../content/siteCopy';

export type DiagramNodeDetail = {
  title: string;
  description: string;
};

export function getDiagramNodeDetail(nodeId: string): DiagramNodeDetail | null {
  const { nodeDescriptions, roles, document, scope } = rolesPublicationCopy;

  switch (nodeId) {
    case 'scope-frame':
      return { title: scope.title, description: nodeDescriptions.scope };
    case 'document-frame':
      return { title: document.title, description: nodeDescriptions.document };
    case 'lead':
      return { title: roles.lead, description: nodeDescriptions.lead };
    case 'author':
      return { title: roles.author, description: nodeDescriptions.author };
    case 'member':
      return { title: roles.member, description: nodeDescriptions.member };
    case 'entwurf':
      return { title: document.entwurf, description: nodeDescriptions.entwurf };
    case 'version':
      return { title: document.version, description: nodeDescriptions.version };
    default:
      return null;
  }
}
