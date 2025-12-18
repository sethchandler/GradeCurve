
import { GradeCategory } from './types';

export const DEFAULT_CATEGORIES: GradeCategory[] = [
  { label: 'A+', gpaValue: 4.333, targetPercent: 4.0 },
  { label: 'A', gpaValue: 4.000, targetPercent: 8.0 },
  { label: 'A-', gpaValue: 3.667, targetPercent: 20.0 },
  { label: 'B+', gpaValue: 3.333, targetPercent: 33.0 },
  { label: 'B', gpaValue: 3.000, targetPercent: 20.0 },
  { label: 'B-', gpaValue: 2.667, targetPercent: 10.0 },
  { label: 'C+', gpaValue: 2.333, targetPercent: 3.0 },
  { label: 'C', gpaValue: 2.000, targetPercent: 1.0 },
  { label: 'C-', gpaValue: 1.667, targetPercent: 0.5 },
  { label: 'D+', gpaValue: 1.333, targetPercent: 0.2 },
  { label: 'D', gpaValue: 1.000, targetPercent: 0.2 },
  { label: 'F', gpaValue: 0.000, targetPercent: 0.1 },
];

export const DEFAULT_TARGET_MEAN = 3.30;
/**
 * Hard limit: The mean MUST be between 3.28 and 3.32.
 * Setting tolerance to 0.02 strictly enforces 3.30 +/- 0.02.
 */
export const DEFAULT_TOLERANCE = 0.02;
