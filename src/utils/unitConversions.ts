/**
 * Unit conversion utilities
 * All values are stored in metric (cm, kg) internally
 * These functions handle conversion for display
 */

export type UnitSystem = 'imperial' | 'metric';

/**
 * Convert cm to inches
 */
export function cmToInches(cm: number): number {
  return cm / 2.54;
}

/**
 * Convert inches to cm
 */
export function inchesToCm(inches: number): number {
  return inches * 2.54;
}

/**
 * Convert kg to lbs
 */
export function kgToLbs(kg: number): number {
  return kg * 2.20462;
}

/**
 * Convert lbs to kg
 */
export function lbsToKg(lbs: number): number {
  return lbs / 2.20462;
}

/**
 * Convert feet and inches to total inches
 */
export function feetInchesToInches(feet: number, inches: number): number {
  return feet * 12 + inches;
}

/**
 * Convert total inches to feet and inches
 */
export function inchesToFeetInches(totalInches: number): { feet: number; inches: number } {
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return { feet, inches };
}

/**
 * Format height for display based on unit system
 */
export function formatHeight(heightCm: number | undefined, unitSystem: UnitSystem): string {
  if (!heightCm) return 'Not set';
  
  if (unitSystem === 'imperial') {
    const totalInches = cmToInches(heightCm);
    const { feet, inches } = inchesToFeetInches(totalInches);
    return `${feet}'${inches}"`;
  } else {
    return `${Math.round(heightCm)} cm`;
  }
}

/**
 * Format weight for display based on unit system
 */
export function formatWeight(weightKg: number | undefined, unitSystem: UnitSystem): string {
  if (!weightKg) return 'Not set';
  
  if (unitSystem === 'imperial') {
    return `${Math.round(kgToLbs(weightKg))} lbs`;
  } else {
    return `${Math.round(weightKg)} kg`;
  }
}
