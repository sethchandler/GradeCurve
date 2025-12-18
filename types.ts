export interface Range {
  min?: number;
  max?: number;
}

export interface GradeDefinition {
  label: string;
  value: number;
}

export interface DistributionConstraint {
  labels: string[];
  percentRange: Range;
}

export interface GradeEngineConfig {
  grades: GradeDefinition[];
  aggregate: {
    mean?: Range;
    median?: Range;
  };
  distribution: DistributionConstraint[];
  targetResultCount: number;
}

export interface ScoreGroup {
  score: number;
  count: number;
}

export interface DistributionResult {
  id: string;
  meanGpa: number;
  medianGpa: number;
  compliance: {
    mean: boolean;
    median: boolean;
    distribution: { label: string; compliant: boolean; actual: number }[];
  };
  gradeCounts: Record<string, number>;
  cutoffs: Record<string, number>;
  rank: number;
}

export interface ScoreInputData {
  raw: number[];
  grouped: ScoreGroup[];
}
