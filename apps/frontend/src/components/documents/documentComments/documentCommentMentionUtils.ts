/** Display `@[userId]` tokens as `@Name` when a name map is available. */
const MENTION_TOKEN_REGEX = /@\[([a-z0-9]+)\]/g;

export function formatCommentMentionText(
  text: string,
  nameByUserId: ReadonlyMap<string, string>
): string {
  return text.replace(MENTION_TOKEN_REGEX, (_match, userId: string) => {
    const name = nameByUserId.get(userId);
    return name != null && name.trim() !== '' ? `@${name}` : '@user';
  });
}

export function insertMentionToken(text: string, cursor: number, userId: string): string {
  const token = `@[${userId}] `;
  return text.slice(0, cursor) + token + text.slice(cursor);
}

export function collectMentionUserIdsFromComments(texts: string[]): string[] {
  const ids = new Set<string>();
  for (const text of texts) {
    for (const match of text.matchAll(MENTION_TOKEN_REGEX)) {
      const id = match[1];
      if (id != null && id !== '') ids.add(id);
    }
  }
  return [...ids];
}
