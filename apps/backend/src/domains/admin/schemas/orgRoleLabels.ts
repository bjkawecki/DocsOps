import { z } from 'zod';

export const ORG_ROLE_KEYS = ['companyLead', 'departmentLead', 'teamLead', 'teamMember'] as const;

export type OrgRoleKey = (typeof ORG_ROLE_KEYS)[number];

/** Instance-wide display override (platform language is monolingual). */
export type OrgRoleLabelBlock = {
  singular?: string;
  plural?: string;
};

export type OrgRoleLabels = Partial<Record<OrgRoleKey, OrgRoleLabelBlock>>;

const LABEL_MAX = 80;

const optionalLabel = z
  .string()
  .max(LABEL_MAX)
  .transform((s) => s.trim())
  .pipe(z.string().max(LABEL_MAX))
  .optional();

/** Empty string after trim is treated as omitted (i18n default). */
const roleLabelBlockSchema = z
  .object({
    singular: optionalLabel,
    plural: optionalLabel,
  })
  .strict()
  .transform((block): OrgRoleLabelBlock => {
    const out: OrgRoleLabelBlock = {};
    if (block.singular != null && block.singular !== '') out.singular = block.singular;
    if (block.plural != null && block.plural !== '') out.plural = block.plural;
    return out;
  });

/**
 * Partial map of org-role display overrides (singular/plural only).
 * Missing role/form = use frontend i18n default for the instance language.
 */
export const orgRoleLabelsSchema = z
  .object({
    companyLead: roleLabelBlockSchema.optional(),
    departmentLead: roleLabelBlockSchema.optional(),
    teamLead: roleLabelBlockSchema.optional(),
    teamMember: roleLabelBlockSchema.optional(),
  })
  .strict()
  .transform((labels): OrgRoleLabels => {
    const out: OrgRoleLabels = {};
    for (const key of ORG_ROLE_KEYS) {
      const role = labels[key];
      if (role && (role.singular != null || role.plural != null)) {
        out[key] = role;
      }
    }
    return out;
  });

/**
 * Parse DB/API JSON. Accepts current shape or legacy `{ en|de: { singular, plural } }`
 * (prefers `en`, then `de`) so older saved values still load.
 */
export function parseOrgRoleLabels(raw: unknown): OrgRoleLabels {
  if (raw == null) return {};
  const direct = orgRoleLabelsSchema.safeParse(raw);
  if (direct.success) return direct.data;
  if (typeof raw !== 'object' || Array.isArray(raw)) return {};
  const migrated: Record<string, unknown> = {};
  for (const key of ORG_ROLE_KEYS) {
    const role = (raw as Record<string, unknown>)[key];
    if (role == null || typeof role !== 'object' || Array.isArray(role)) continue;
    const r = role as Record<string, unknown>;
    if ('singular' in r || 'plural' in r) {
      migrated[key] = { singular: r.singular, plural: r.plural };
      continue;
    }
    const en = r.en;
    const de = r.de;
    const pick =
      en != null && typeof en === 'object' && !Array.isArray(en)
        ? en
        : de != null && typeof de === 'object' && !Array.isArray(de)
          ? de
          : null;
    if (pick && typeof pick === 'object') {
      const p = pick as Record<string, unknown>;
      migrated[key] = { singular: p.singular, plural: p.plural };
    }
  }
  const remapped = orgRoleLabelsSchema.safeParse(migrated);
  return remapped.success ? remapped.data : {};
}

/** Normalize for storage (strip empties). Throws ZodError on invalid shape. */
export function normalizeOrgRoleLabels(raw: unknown): OrgRoleLabels {
  return orgRoleLabelsSchema.parse(raw ?? {});
}
