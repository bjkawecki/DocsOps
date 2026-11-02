import { z } from 'zod';

/** Schema für den Login-Request-Body (E-Mail + Passwort). */
export const loginBodySchema = z.object({
  email: z.email({ error: () => 'Invalid email address' }),
  password: z.string().min(1, 'Passwort erforderlich'),
});

export type LoginBody = z.infer<typeof loginBodySchema>;

export {
  demoLoginBodySchema,
  demoLoginRoleSchema,
  DEMO_SEED_EMAIL_BY_ROLE,
  demoSeedEmailForRole,
  type DemoLoginBody,
  type DemoLoginRole,
} from './demoLogin.js';
