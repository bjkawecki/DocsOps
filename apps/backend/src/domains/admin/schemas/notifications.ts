import { z } from 'zod';

export const adminBroadcastTargetKindSchema = z.enum([
  'all',
  'admins',
  'company_leads',
  'department_leads',
  'team_leads',
  'users',
]);

export const adminBroadcastBodySchema = z
  .object({
    title: z.string().min(1).max(200),
    message: z.string().min(1).max(4000),
    targetKind: adminBroadcastTargetKindSchema,
    userIds: z.array(z.string().min(1)).max(1000).optional(),
    sendAt: z.iso.datetime().optional(),
  })
  .superRefine((body, ctx) => {
    if (body.targetKind === 'users') {
      if (body.userIds == null || body.userIds.length === 0) {
        ctx.addIssue({
          code: 'custom',
          message: 'userIds required when targetKind is users',
          path: ['userIds'],
        });
      }
    }
  });

export type AdminBroadcastBody = z.infer<typeof adminBroadcastBodySchema>;

export const adminBroadcastIdParamSchema = z.object({
  broadcastId: z.string().min(1).max(64),
});

export const adminBroadcastScheduleBodySchema = z.object({
  sendAt: z.iso.datetime(),
});

export const adminBroadcastListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  status: z.enum(['sent', 'scheduled', 'cancelled', 'all']).default('sent'),
});

export type AdminBroadcastTargetKind = z.infer<typeof adminBroadcastTargetKindSchema>;
