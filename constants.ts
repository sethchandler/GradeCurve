import { GradeEngineConfig } from './types';

export const EMORY_LAW_CONFIG: GradeEngineConfig = {
  grades: [
    { label: 'A+', value: 4.333 },
    { label: 'A', value: 4.000 },
    { label: 'A-', value: 3.667 },
    { label: 'B+', value: 3.333 },
    { label: 'B', value: 3.000 },
    { label: 'B-', value: 2.667 },
    { label: 'C+', value: 2.333 },
    { label: 'C', value: 2.000 },
    { label: 'C-', value: 1.667 },
    { label: 'D+', value: 1.333 },
    { label: 'D', value: 1.000 },
    { label: 'F', value: 0.000 },
  ],
  aggregate: {
    mean: { min: 3.28, max: 3.32 }
  },
  distribution: [
    {
      labels: ['A', 'A-'],
      percentRange: { min: 7, max: 16 }
    },
    {
      labels: ['B+'],
      percentRange: { min: 0, max: 27 } // Example: "no more than 27% Bs" might mean B+ here or group
    }
  ],
  targetResultCount: 3
};

export const DEFAULT_CONFIG = EMORY_LAW_CONFIG;
