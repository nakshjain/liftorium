import type { DistanceUnit } from '../../features/settings/settings.models';

const KM_PER_MI = 1.60934;

/** Convert miles to kilometres, rounded to 3 decimal places. */
export function miToKm(mi: number): number {
  return Math.round(mi * KM_PER_MI * 1000) / 1000;
}

/** Convert kilometres to miles, rounded to 2 decimal places. */
export function kmToMi(km: number): number {
  return Math.round((km / KM_PER_MI) * 100) / 100;
}

/**
 * Convert a stored km value to the user's preferred display unit.
 * Returns the numeric value only — use {@link formatDistance} for a labelled string.
 */
export function toDisplayDistance(km: number, unit: DistanceUnit): number {
  return unit === 'mi' ? kmToMi(km) : km;
}

/**
 * Convert a user-entered value in their preferred unit to km for storage.
 * This is the only function that should be called before sending distance to the API.
 */
export function toStorageKm(displayValue: number, unit: DistanceUnit): number {
  return unit === 'mi' ? miToKm(displayValue) : displayValue;
}

/**
 * Format a stored km value as a human-readable string with unit label.
 * e.g. 5 km + 'mi' → "3.11 mi"
 *      5 km + 'km'  → "5 km"
 */
export function formatDistance(km: number, unit: DistanceUnit): string {
  if (km <= 0) return '—';
  const display = toDisplayDistance(km, unit);
  const rounded = display % 1 === 0 ? display.toString() : display.toFixed(2);
  return `${rounded} ${unit}`;
}

/**
 * Format a distance for compact inline use (e.g. perf labels).
 * e.g. 5 km + 'km' → "5km"
 *      5 km + 'mi' → "3.11mi"
 */
export function formatDistanceCompact(km: number, unit: DistanceUnit): string {
  if (km <= 0) return '—';
  const display = toDisplayDistance(km, unit);
  const rounded = display % 1 === 0 ? display.toString() : display.toFixed(2);
  return `${rounded}${unit}`;
}
