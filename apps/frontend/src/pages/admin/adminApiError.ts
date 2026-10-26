import type { TFunction } from 'i18next';

type ApiErrorBody = { error?: string; code?: string };

export class AdminApiError extends Error {
  readonly code: string | undefined;

  constructor(message: string, code?: string) {
    super(message);
    this.name = 'AdminApiError';
    this.code = code;
  }
}

/** Parse a failed admin API response into AdminApiError (with optional stable code). */
export async function throwAdminApiError(res: Response): Promise<never> {
  const body = (await res.json().catch(() => ({}))) as ApiErrorBody;
  throw new AdminApiError(body.error ?? res.statusText, body.code);
}

/** English server fallbacks → stable codes (until all clients send `code`). */
const LEGACY_SCOPE_MESSAGE_TO_CODE: Record<string, string> = {
  'User not found': 'SCOPE_USER_NOT_FOUND',
  'Cannot assign platform administrator while user has organization or knowledge manager assignments. Remove those roles first.':
    'SCOPE_ADMIN_WHILE_ASSIGNMENTS',
  'Cannot assign knowledge manager while user is a platform administrator.': 'SCOPE_KM_WHILE_ADMIN',
  'Cannot assign knowledge manager while user has organization assignments. Remove organization roles first.':
    'SCOPE_KM_WHILE_ORG',
  'User is a platform administrator and cannot receive organization assignments.':
    'SCOPE_ADMIN_BLOCKS_ORG',
  'User is a knowledge manager and cannot receive organization assignments.': 'SCOPE_KM_BLOCKS_ORG',
  'User already has a company lead assignment.': 'SCOPE_ALREADY_COMPANY_LEAD',
  'User already has a department lead assignment.': 'SCOPE_ALREADY_DEPARTMENT_LEAD',
  'User already has a department author assignment. Remove it before assigning another organization role.':
    'SCOPE_ALREADY_DEPARTMENT_AUTHOR',
  'User already has a team or department author assignment. Remove organization roles before assigning company lead.':
    'SCOPE_COMPANY_LEAD_CONFLICT',
  'User already has a team assignment. Remove team roles before assigning department lead.':
    'SCOPE_DEPARTMENT_LEAD_CONFLICT',
  'User already has a team lead assignment. Remove team roles before assigning department author.':
    'SCOPE_DEPT_AUTHOR_HAS_TEAM_LEAD',
  'User already has a team author assignment. Remove team roles before assigning department author.':
    'SCOPE_DEPT_AUTHOR_HAS_TEAM_AUTHOR',
  'User has team membership outside this department. Remove it before assigning department author.':
    'SCOPE_DEPT_AUTHOR_OUTSIDE_MEMBER',
  'User already has a department author assignment in another department.':
    'SCOPE_DEPT_AUTHOR_OTHER_DEPT',
  'User already has a team lead assignment. Remove the team lead role before assigning another team role.':
    'SCOPE_TEAM_LEAD_BLOCKS_ROLE',
  'User already has a team author assignment. Remove the team author role before assigning another team role.':
    'SCOPE_TEAM_AUTHOR_BLOCKS_ROLE',
  'User already has team membership. Remove team membership before assigning team lead.':
    'SCOPE_TEAM_MEMBER_BLOCKS_LEAD',
  'User already has a team assignment. Remove the existing team role before assigning a new one.':
    'SCOPE_TEAM_ASSIGNMENT_EXISTS',
  'User already has a team assignment. Remove the existing team role before assigning team author.':
    'SCOPE_TEAM_ASSIGNMENT_EXISTS',
  'User already has a team assignment. Remove the existing team role before assigning team membership.':
    'SCOPE_TEAM_ASSIGNMENT_EXISTS',
};

function translateErrorCode(t: TFunction<'admin'>, code: string): string | null {
  const translated = t(`shared.errors.${code}`, { defaultValue: '' });
  return translated || null;
}

/** Prefer i18n for known codes; fall back to server message. */
export function adminApiErrorMessage(t: TFunction<'admin'>, error: Error): string {
  const code = error instanceof AdminApiError ? error.code : undefined;
  if (code) {
    const translated = translateErrorCode(t, code);
    if (translated) return translated;
  }
  const legacyCode = LEGACY_SCOPE_MESSAGE_TO_CODE[error.message];
  if (legacyCode) {
    const translated = translateErrorCode(t, legacyCode);
    if (translated) return translated;
  }
  return error.message;
}
