import type { WeightUnit } from '../../features/settings/settings.models';

const LB_PER_KG = 2.20462262185;

/** Convert pounds to kilograms, rounded to 2 decimal places. */
export function lbToKg(lb: number): number {
  return Math.round((lb / LB_PER_KG) * 100) / 100;
}

/** Convert kilograms to pounds, rounded to 1 decimal place. */
export function kgToLb(kg: number): number {
  return Math.round(kg * LB_PER_KG * 10) / 10;
}

/**
 * Convert a stored kg value to the user's preferred display unit.
 * Returns the numeric value — use `formatWeight` for a labelled string.
 */
export function toDisplayWeight(kg: number, unit: WeightUnit): number {
  return unit === 'lb' ? kgToLb(kg) : kg;
}

/**
 * Convert a user-entered value in their preferred unit to kg for storage.
 * This is the only function that should be called before sending weight to the API.
 */
export function toStorageKg(displayValue: number, unit: WeightUnit): number {
  return unit === 'lb' ? lbToKg(displayValue) : displayValue;
}

/**
 * Format a stored kg value as a human-readable string with unit label.
 * e.g. 102.058 kg + 'lb' → "225 lb"
 *      100 kg + 'kg'  → "100 kg"
 */
export function formatWeight(kg: number, unit: WeightUnit): string {
  if (kg <= 0) return '—';
  const display = toDisplayWeight(kg, unit);
  const rounded = display % 1 === 0 ? display.toString() : display.toFixed(1);
  return `${rounded} ${unit}`;
}

/**
 * Format a weight for compact inline use (e.g. perf labels, chart points).
 * e.g. 100 kg + 'kg' → "100kg"
 *      102.058 kg + 'lb' → "225lb"
 */
export function formatWeightCompact(kg: number, unit: WeightUnit): string {
  if (kg <= 0) return '—';
  const display = toDisplayWeight(kg, unit);
  const rounded = display % 1 === 0 ? display.toString() : display.toFixed(1);
  return `${rounded}${unit}`;
}

/**
 * The step size for +/- weight steppers in the user's preferred unit.
 * kg → 2.5,  lb → 5
 */
export function weightStep(unit: WeightUnit): number {
  return unit === 'lb' ? 5 : 2.5;
}

/**
 * Default starting weight for a new set in the user's preferred unit.
 * kg → 20,  lb → 45 (≈ empty barbell)
 */
export function defaultWeight(unit: WeightUnit): number {
  return unit === 'lb' ? 45 : 20;
}
