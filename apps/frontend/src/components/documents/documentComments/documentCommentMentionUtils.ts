/** Storage token `@[userId]` in API payloads. */
const MENTION_TOKEN_REGEX = /@\[([a-z0-9]+)\]/g;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Display `@[userId]` tokens as `@Name` when a name map is available. */
export function formatCommentMentionText(
  text: string,
  nameByUserId: ReadonlyMap<string, string>
): string {
  return text.replace(MENTION_TOKEN_REGEX, (_match, userId: string) => {
    const name = nameByUserId.get(userId);
    return name != null && name.trim() !== '' ? `@${name}` : '@user';
  });
}

/** Convert display `@Name` mentions back to `@[userId]` for the API (longest names first). */
export function encodeMentionsForApi(
  displayText: string,
  candidates: ReadonlyArray<{ id: string; name: string }>
): string {
  const sorted = [...candidates].sort((a, b) => b.name.length - a.name.length);
  let result = displayText;
  for (const c of sorted) {
    const name = c.name.trim();
    if (name === '') continue;
    result = result.replace(new RegExp(`@${escapeRegExp(name)}(?![\\w])`, 'g'), `@[${c.id}]`);
  }
  return result;
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
