/**
 * Formats an ISO date string as a human-readable relative time.
 *
 * @param iso  - ISO 8601 date string, or null/undefined (returns '' for null/undefined).
 * @param format - 'short' for abbreviated units (7d ago, 2w ago, 3mo ago);
 *                 'long'  for full words (7 days ago, 2 weeks ago, 3 months ago).
 *                 Defaults to 'long'.
 *
 * @example
 * formatRelativeTime('2024-01-01T00:00:00Z', 'short') // '6mo ago'
 * formatRelativeTime('2024-01-01T00:00:00Z', 'long')  // '6 months ago'
 */
export function formatRelativeTime(
  iso: string | null | undefined,
  format: 'short' | 'long' = 'long',
): string {
  if (!iso) return '';

  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / 86_400_000);

  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';

  if (format === 'short') {
    if (days < 7)   return `${days}d ago`;
    if (days < 30)  return `${Math.floor(days / 7)}w ago`;
    if (days < 365) return `${Math.floor(days / 30)}mo ago`;
    return `${Math.floor(days / 365)}y ago`;
  }

  // long
  if (days < 7)   return `${days} days ago`;
  if (days < 30)  return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}
