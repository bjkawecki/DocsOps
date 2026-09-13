import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useOrgRoleLabel } from '../../../hooks/useOrgRoleLabel.js';

export type BroadcastTargetKind =
  | 'all'
  | 'admins'
  | 'company_leads'
  | 'department_leads'
  | 'team_leads'
  | 'users';

export type BroadcastDeliveryMode = 'now' | 'scheduled';

export type BroadcastHistoryItem = {
  id: string;
  title: string;
  message: string;
  targetKind: string;
  status: 'scheduled' | 'sent' | 'cancelled';
  deliveredCount: number;
  createdAt: string;
  scheduledAt: string | null;
  sentAt: string | null;
};

export type ScheduledBroadcastItem = {
  id: string;
  title: string;
  message: string;
  targetKind: string;
  scheduledAt: string;
};

export type BroadcastDraft = {
  title: string;
  message: string;
  targetKind: BroadcastTargetKind;
  userIds: string[];
  deliveryMode: BroadcastDeliveryMode;
  sendAtLocal: string;
};

function broadcastTargetLabel(
  t: (key: string) => string,
  roleLabel: (role: string, opts?: { form?: 'singular' | 'plural' }) => string,
  targetKind: string
): string {
  switch (targetKind) {
    case 'all':
      return t('broadcast.targets.all');
    case 'admins':
      return t('broadcast.targets.admins');
    case 'company_leads':
      return roleLabel('companyLead', { form: 'plural' });
    case 'department_leads':
      return roleLabel('departmentLead', { form: 'plural' });
    case 'team_leads':
      return roleLabel('teamLead', { form: 'plural' });
    case 'users':
      return t('broadcast.targets.users');
    default:
      return targetKind;
  }
}

export function useBroadcastTargetLabel(): (targetKind: string) => string {
  const { t } = useTranslation('admin');
  const roleLabel = useOrgRoleLabel();
  return useMemo(
    () => (targetKind: string) => broadcastTargetLabel(t, roleLabel, targetKind),
    [t, roleLabel]
  );
}

export function useBroadcastTargetOptions(): Array<{ value: BroadcastTargetKind; label: string }> {
  const labelFor = useBroadcastTargetLabel();
  return useMemo(
    () =>
      (
        [
          'all',
          'admins',
          'company_leads',
          'department_leads',
          'team_leads',
          'users',
        ] as BroadcastTargetKind[]
      ).map((value) => ({
        value,
        label: labelFor(value),
      })),
    [labelFor]
  );
}

export {
  datetimeLocalToIso,
  defaultFutureDatetimeLocal,
  formatLocalDateTime,
  isoToDatetimeLocal,
  isDatetimeLocalInFuture,
  minDatetimeLocalNow,
  sendAtFieldLabel,
} from '../../../lib/localDateTime.js';
