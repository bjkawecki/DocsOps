import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { usePublicConfig } from './usePublicConfig.js';
import { resolveOrgRoleLabel, type OrgRoleForm } from '../lib/orgRoleLabel.js';

export type UseOrgRoleLabelOptions = {
  count?: number;
  form?: OrgRoleForm;
};

/**
 * Resolved org-role display label (config override or i18n default).
 */
export function useOrgRoleLabel() {
  const { t, i18n } = useTranslation('common');
  const { data } = usePublicConfig();

  return useCallback(
    (role: string, options?: UseOrgRoleLabelOptions): string => {
      const count =
        options?.form === 'plural' ? 2 : options?.form === 'singular' ? 1 : options?.count;
      return resolveOrgRoleLabel(t, i18n.language, data?.orgRoleLabels, role, { count });
    },
    [t, i18n.language, data?.orgRoleLabels]
  );
}
