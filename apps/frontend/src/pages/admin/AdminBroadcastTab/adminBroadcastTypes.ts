import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

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

const BROADCAST_TARGET_TRANSLATION_KEYS: Record<BroadcastTargetKind, string> = {
  all: 'all',
  admins: 'admins',
  company_leads: 'companyLeads',
  department_leads: 'departmentLeads',
  team_leads: 'teamLeads',
  users: 'users',
};

function buildBroadcastTargetLabel(t: TFunction) {
  return (targetKind: string): string => {
    const key = BROADCAST_TARGET_TRANSLATION_KEYS[targetKind as BroadcastTargetKind];
    return key ? t(`broadcast.targets.${key}`) : targetKind;
  };
}

export function useBroadcastTargetLabel(): (targetKind: string) => string {
  const { t } = useTranslation('admin');
  return useMemo(() => buildBroadcastTargetLabel(t), [t]);
}

export function useBroadcastTargetOptions(): Array<{ value: BroadcastTargetKind; label: string }> {
  const { t } = useTranslation('admin');
  return useMemo(
    () =>
      (Object.keys(BROADCAST_TARGET_TRANSLATION_KEYS) as BroadcastTargetKind[]).map((value) => ({
        value,
        label: t(`broadcast.targets.${BROADCAST_TARGET_TRANSLATION_KEYS[value]}`),
      })),
    [t]
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
