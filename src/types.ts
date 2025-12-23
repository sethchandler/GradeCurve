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

export interface ScoreRow {
  [key: string]: any;
  __raw_score__?: number;
  __normalized_score__?: number;
  __missing_score__?: boolean;
}

export interface WebAppConfig extends GradeEngineConfig {
  scoreColumn: string;
  preservedColumns: string[];
  geminiApiKey?: string;
}

export interface ScoreGroup {
  score: number;
  count: number;
}

export interface DistributionResult {
  id: string;
  meanGpa: number;
  medianGpa: number;
  isFallback?: boolean;
  compliance: {
    mean: boolean;
    median: boolean;
    distribution: { label: string; compliant: boolean; actual: number }[];
  };
  gradeCounts: Record<string, number>;
  cutoffs: Record<string, number>;
  rank: number;
  scoreMap: Record<number, string>; // Maps raw score to grade label
}

export interface ScoreInputData {
  raw: number[];
  grouped: ScoreGroup[];
}
