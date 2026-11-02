/** Number of login taglines in auth.taglines (keep in sync with locale JSON). */
export const LOGIN_TAGLINE_COUNT = 14;

export function randomLoginTaglineIndex(): number {
  return Math.floor(Math.random() * LOGIN_TAGLINE_COUNT);
}
