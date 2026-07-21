/** Max width for settings content cards (card itself is constrained; content fills 100%). */
export const SETTINGS_CONTENT_MAX_WIDTH = 640;

/** Inner padding for settings cards (looser than default content cards). */
export const SETTINGS_CARD_PADDING = 'lg' as const;

/** Vertical gap between title and body blocks inside a settings card. */
export const SETTINGS_CARD_STACK_GAP = 'lg' as const;

/** Tighter gap for repeated rows (switches, field groups) inside a settings card. */
export const SETTINGS_CARD_ROW_GAP = 'md' as const;

/** Gap between a setting label and its short description (keep tight). */
export const SETTINGS_FIELD_LABEL_GAP = 2;

/** Query key that opens the settings modal and selects the jump target card. */
export const SETTINGS_QUERY_KEY = 'settings';

export type SettingsJumpId =
  | 'profile'
  | 'identity'
  | 'appearance'
  | 'email'
  | 'password'
  | 'sessions'
  | 'storage'
  | 'notifications-in-app'
  | 'notifications-email';

/** @deprecated Use SettingsJumpId */
export type SettingsSection = SettingsJumpId;

export const DEFAULT_SETTINGS_JUMP_ID: SettingsJumpId = 'profile';

/** @deprecated Use DEFAULT_SETTINGS_JUMP_ID */
export const DEFAULT_SETTINGS_SECTION = DEFAULT_SETTINGS_JUMP_ID;

export const SETTINGS_JUMP_IDS: ReadonlyArray<SettingsJumpId> = [
  'profile',
  'identity',
  'appearance',
  'email',
  'password',
  'sessions',
  'storage',
  'notifications-in-app',
  'notifications-email',
];

/** @deprecated Use SETTINGS_JUMP_IDS */
export const SETTINGS_SECTION_VALUES = SETTINGS_JUMP_IDS;

export const SETTINGS_JUMP_LABELS: Record<SettingsJumpId, string> = {
  profile: 'Profile',
  identity: 'DocsOps Identity',
  appearance: 'Appearance',
  email: 'Email',
  password: 'Password',
  sessions: 'Sessions',
  storage: 'Storage',
  'notifications-in-app': 'In-app',
  'notifications-email': 'Email notifications',
};

/** @deprecated Use SETTINGS_JUMP_LABELS */
export const SETTINGS_SECTION_LABELS = SETTINGS_JUMP_LABELS;

const LEGACY_SETTINGS_TO_JUMP: Record<string, SettingsJumpId> = {
  general: 'profile',
  account: 'email',
  security: 'sessions',
  notifications: 'notifications-in-app',
};

export function settingsCardDomId(jumpId: SettingsJumpId): string {
  return `settings-${jumpId}`;
}

export function parseSettingsJumpId(raw: string | null): SettingsJumpId {
  if (raw == null || raw === '') return DEFAULT_SETTINGS_JUMP_ID;
  if (SETTINGS_JUMP_IDS.includes(raw as SettingsJumpId)) {
    return raw as SettingsJumpId;
  }
  const mapped = LEGACY_SETTINGS_TO_JUMP[raw];
  if (mapped != null) return mapped;
  return DEFAULT_SETTINGS_JUMP_ID;
}

/** @deprecated Use parseSettingsJumpId */
export function parseSettingsSection(raw: string | null): SettingsJumpId {
  return parseSettingsJumpId(raw);
}

export function isSettingsOpen(searchParams: URLSearchParams): boolean {
  return searchParams.has(SETTINGS_QUERY_KEY);
}

export function getSettingsJumpId(searchParams: URLSearchParams): SettingsJumpId {
  return parseSettingsJumpId(searchParams.get(SETTINGS_QUERY_KEY));
}

/** @deprecated Use getSettingsJumpId */
export function getSettingsSection(searchParams: URLSearchParams): SettingsJumpId {
  return getSettingsJumpId(searchParams);
}

export function openSettingsSearchParams(
  prev: URLSearchParams,
  jumpId: SettingsJumpId = DEFAULT_SETTINGS_JUMP_ID
): URLSearchParams {
  const next = new URLSearchParams(prev);
  next.set(SETTINGS_QUERY_KEY, jumpId);
  return next;
}

export function closeSettingsSearchParams(prev: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(prev);
  next.delete(SETTINGS_QUERY_KEY);
  return next;
}

/** Map legacy `/settings?section=` (or `settings`) to a jump id. */
export function settingsSectionFromLegacySearch(searchParams: URLSearchParams): SettingsJumpId {
  return parseSettingsJumpId(searchParams.get(SETTINGS_QUERY_KEY) ?? searchParams.get('section'));
}
