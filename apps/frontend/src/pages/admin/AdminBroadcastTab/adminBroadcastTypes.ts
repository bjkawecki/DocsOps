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

export const BROADCAST_TARGET_LABELS: Record<BroadcastTargetKind, string> = {
  all: 'All active users',
  admins: 'Administrators',
  company_leads: 'Company leads',
  department_leads: 'Department leads',
  team_leads: 'Team leads',
  users: 'Selected users',
};

export const BROADCAST_TARGET_OPTIONS = (
  Object.entries(BROADCAST_TARGET_LABELS) as Array<[BroadcastTargetKind, string]>
).map(([value, label]) => ({ value, label }));

export function broadcastTargetLabel(targetKind: string): string {
  return BROADCAST_TARGET_LABELS[targetKind as BroadcastTargetKind] ?? targetKind;
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
