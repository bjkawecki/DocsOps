import { ScopeWorkspaceEntry } from '../contextWorkspace/ScopeWorkspaceEntry.js';

const PERSONAL_SCOPE = { type: 'personal' as const };

/** Personal scope landing → default context workspace or empty create state. */
export function PersonalPage() {
  return <ScopeWorkspaceEntry scope={PERSONAL_SCOPE} scopeLabel="Personal" canManage />;
}
