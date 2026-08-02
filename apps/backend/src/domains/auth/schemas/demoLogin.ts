import { z } from 'zod';

/** Seed roles for DEMO_MODE one-click login (matches prisma/seed-data). */
export const demoLoginRoleSchema = z.enum([
  'admin',
  'companyLead',
  'departmentLead',
  'teamLead',
  'member',
]);

export type DemoLoginRole = z.infer<typeof demoLoginRoleSchema>;

export const demoLoginBodySchema = z.object({
  role: demoLoginRoleSchema,
});

export type DemoLoginBody = z.infer<typeof demoLoginBodySchema>;

/** Fixed seed emails – SSoT aligned with apps/backend/prisma/seed-data/users.csv + ADMIN_EMAIL. */
export const DEMO_SEED_EMAIL_BY_ROLE: Record<DemoLoginRole, string> = {
  admin: 'admin@demo.docsops.local',
  companyLead: 'company.lead@demo.docsops.local',
  departmentLead: 'department.lead@demo.docsops.local',
  teamLead: 'team.lead@demo.docsops.local',
  member: 'member@demo.docsops.local',
};
