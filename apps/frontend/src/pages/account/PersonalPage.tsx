import { useTranslation } from 'react-i18next';
import { ScopeWorkspaceEntry } from '../contextWorkspace/ScopeWorkspaceEntry.js';

const PERSONAL_SCOPE = { type: 'personal' as const };

/** Personal scope landing → default context workspace or empty create state. */
export function PersonalPage() {
  const { t } = useTranslation('contexts');
  return (
    <ScopeWorkspaceEntry scope={PERSONAL_SCOPE} scopeLabel={t('scopeKind.personal')} canManage />
  );
}
