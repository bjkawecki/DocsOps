import type { FastifyInstance } from 'fastify';
import {
  canWriteContext,
  getContextOwnerId,
} from '../../organisation/permissions/contextPermissions.js';

type ReplyLike = { status: (code: number) => { send: (body: unknown) => unknown } };

export async function validateContextWriteAccess(
  prisma: FastifyInstance['prisma'],
  userId: string,
  contextId: string,
  reply: ReplyLike,
  forbiddenMessage: string
): Promise<boolean> {
  const context = await prisma.context.findUnique({
    where: { id: contextId },
    select: { id: true },
  });
  if (!context) {
    await reply.status(404).send({ error: 'Context not found' });
    return false;
  }
  const allowed = await canWriteContext(prisma, userId, contextId);
  if (!allowed) {
    await reply.status(403).send({ error: forbiddenMessage });
    return false;
  }
  return true;
}

export async function validateTagsForContext(
  prisma: FastifyInstance['prisma'],
  contextId: string,
  tagIds: string[],
  reply: ReplyLike
): Promise<boolean> {
  if (tagIds.length === 0) return true;
  const contextOwnerId = await getContextOwnerId(prisma, contextId);
  if (!contextOwnerId) {
    await reply
      .status(400)
      .send({ error: 'Kontext hat keinen Owner; Tags können nicht zugewiesen werden.' });
    return false;
  }
  const tags = await prisma.tag.findMany({
    where: { id: { in: tagIds } },
    select: { id: true, ownerId: true },
  });
  const invalid = tags.some((t) => t.ownerId !== contextOwnerId);
  if (invalid || tags.length !== tagIds.length) {
    await reply
      .status(400)
      .send({ error: 'Ein oder mehrere Tags gehören nicht zum Kontext-Scope.' });
    return false;
  }
  return true;
}
