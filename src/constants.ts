import { GradeEngineConfig } from './types';

export const EMORY_LAW_CONFIG: GradeEngineConfig = {
  grades: [
    { label: 'A+', value: 4.333 },
    { label: 'A', value: 4.000 },
    { label: 'A-', value: 3.666 },
    { label: 'B+', value: 3.333 },
    { label: 'B', value: 3.000 },
    { label: 'B-', value: 2.666 },
    { label: 'C+', value: 2.333 },
    { label: 'C', value: 2.000 },
    { label: 'C-', value: 1.666 },
    { label: 'D', value: 1.000 },
    { label: 'F', value: 0.000 },
  ],
  aggregate: {
    mean: { min: 3.28, max: 3.32 }
  },
  distribution: [
    {
      labels: ['A+', 'A'],
      percentRange: { min: 11, max: 13 }
    },
    {
      labels: ['A-'],
      percentRange: { min: 18, max: 22 }
    },
    {
      labels: ['B+'],
      percentRange: { min: 30, max: 36 }
    },
    {
      labels: ['B'],
      percentRange: { min: 18, max: 22 }
    },
    {
      labels: ['B-'],
      percentRange: { min: 11, max: 15 }
    },
    {
      labels: ['C+', 'C', 'C-', 'D', 'F'],
      percentRange: { min: 1, max: 3 }
    }
  ],
  targetResultCount: 3
};

export const DEFAULT_CONFIG = EMORY_LAW_CONFIG;
