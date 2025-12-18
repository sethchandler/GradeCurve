
export interface GradeCategory {
  label: string;
  gpaValue: number;
  targetPercent: number;
}

export interface ScoreGroup {
  score: number;
  count: number;
}

export interface DistributionResult {
  id: string;
  meanGpa: number;
  meanDeviation: number;
  distributionError: number;
  gradeCounts: Record<string, number>;
  cutoffs: Record<string, number>; // Maps grade label to minimum score required
  rank: number;
}

export interface GradeEngineConfig {
  targetMean: number;
  meanTolerance: number;
  categories: GradeCategory[];
}

export interface ScoreInputData {
  raw: number[];
  grouped: ScoreGroup[];
}
