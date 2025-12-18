import { GradeEngineConfig } from './types';

export const USER_SPECIFIED_CONFIG: GradeEngineConfig = {
  grades: [
    { label: 'A+', value: 4.30 },
    { label: 'A', value: 4.00 },
    { label: 'A-', value: 3.70 },
    { label: 'B+', value: 3.30 },
    { label: 'B', value: 3.00 },
    { label: 'B-', value: 2.70 },
    { label: 'C+', value: 2.30 },
    { label: 'C', value: 2.00 }, // Note: C and below = 2.0
    { label: 'D', value: 2.00 },
    { label: 'F', value: 2.00 },
  ],
  aggregate: {
    mean: { min: 3.28, max: 3.32 } // Target 3.30 +/- 0.02
  },
  distribution: [
    {
      labels: ['A+', 'A'],
      percentRange: { min: 11, max: 13 } // Target ~12%
    },
    {
      labels: ['A-'],
      percentRange: { min: 18, max: 22 } // Target ~20%
    },
    {
      labels: ['B+'],
      percentRange: { min: 30, max: 36 } // Target ~33%
    },
    {
      labels: ['B'],
      percentRange: { min: 18, max: 22 } // Target ~20%
    },
    {
      labels: ['B-'],
      percentRange: { min: 11, max: 15 } // Target ~13%
    },
    {
      labels: ['C+', 'C', 'D', 'F'],
      percentRange: { min: 1, max: 3 } // Target ~2%
    }
  ],
  targetResultCount: 3
};

export const DEFAULT_CONFIG = USER_SPECIFIED_CONFIG;
