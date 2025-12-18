import {
  GradeEngineConfig,
  DistributionResult,
  Range,
  GradeDefinition
} from '../types';

interface SearchState {
  scoreIdx: number;
  totalPoints: number;
  totalStudents: number;
  counts: Record<string, number>;
  cutoffs: Record<string, number>;
  medianGpa?: number;
}

const checkRange = (val: number, range?: Range): boolean => {
  if (!range) return true;
  if (range.min !== undefined && val < range.min - 0.0001) return false;
  if (range.max !== undefined && val > range.max + 0.0001) return false;
  return true;
};

export const calculateDistributions = (
  scores: number[],
  config: GradeEngineConfig
): DistributionResult[] => {
  if (scores.length === 0) return [];

  const scoreCounts: Record<number, number> = {};
  scores.forEach(s => { scoreCounts[s] = (scoreCounts[s] || 0) + 1; });

  const sortedUniqueScores = Object.keys(scoreCounts)
    .map(Number)
    .sort((a, b) => b - a);

  const N = scores.length;
  const medianIdx = (N + 1) / 2;
  const BEAM_WIDTH = 500; // Increased for more variety in results

  let currentStates: SearchState[] = [{
    scoreIdx: 0,
    totalPoints: 0,
    totalStudents: 0,
    counts: {},
    cutoffs: {}
  }];

  for (let catIdx = 0; catIdx < config.grades.length; catIdx++) {
    const nextStates: SearchState[] = [];
    const isLast = catIdx === config.grades.length - 1;
    const grade = config.grades[catIdx];

    for (const state of currentStates) {
      if (isLast) {
        const remainingCount = N - state.totalStudents;
        const finalPoints = state.totalPoints + (remainingCount * grade.value);
        const finalCounts = { ...state.counts, [grade.label]: remainingCount };
        const finalCutoffs = { ...state.cutoffs, [grade.label]: sortedUniqueScores[sortedUniqueScores.length - 1] || 0 };

        let finalMedian = state.medianGpa;
        if (finalMedian === undefined) finalMedian = grade.value;

        // Final Aggregate Validation
        const mean = finalPoints / N;
        if (checkRange(mean, config.aggregate.mean) && checkRange(finalMedian, config.aggregate.median)) {
          // Final Distribution Validation
          let distributionValid = true;
          const distributionCompliance: { label: string; compliant: boolean; actual: number }[] = [];

          for (const dist of config.distribution) {
            const groupCount = dist.labels.reduce((sum, label) => sum + (finalCounts[label] || 0), 0);
            const groupPercent = (groupCount / N) * 100;
            const compliant = checkRange(groupPercent, dist.percentRange);
            if (!compliant) distributionValid = false;
            distributionCompliance.push({
              label: dist.labels.join('+'),
              compliant,
              actual: parseFloat(groupPercent.toFixed(2))
            });
          }

          if (distributionValid) {
            nextStates.push({
              scoreIdx: sortedUniqueScores.length,
              totalPoints: finalPoints,
              totalStudents: N,
              counts: finalCounts,
              cutoffs: finalCutoffs,
              medianGpa: finalMedian
            });
          }
        }
        continue;
      }

      // EXPLORE: Try different cutoff points for this category
      let assignedInCat = 0;
      for (let i = state.scoreIdx; i <= sortedUniqueScores.length; i++) {
        const nextTotalStudents = state.totalStudents + assignedInCat;
        const nextPoints = state.totalPoints + (assignedInCat * grade.value);

        let nextMedian = state.medianGpa;
        if (nextMedian === undefined && nextTotalStudents >= medianIdx) {
          nextMedian = grade.value;
        }

        // Pruning: Mean feasibility
        const remainingStudents = N - nextTotalStudents;
        const minPossiblePoints = nextPoints + (remainingStudents * config.grades[config.grades.length - 1].value);
        const maxPossiblePoints = nextPoints + (remainingStudents * config.grades[0].value);

        const meanPossible = (!config.aggregate.mean) ||
          ((!config.aggregate.mean.max || minPossiblePoints / N <= config.aggregate.mean.max + 0.0001) &&
            (!config.aggregate.mean.min || maxPossiblePoints / N >= config.aggregate.mean.min - 0.0001));

        if (meanPossible) {
          nextStates.push({
            scoreIdx: i,
            totalPoints: nextPoints,
            totalStudents: nextTotalStudents,
            counts: { ...state.counts, [grade.label]: assignedInCat },
            cutoffs: { ...state.cutoffs, [grade.label]: sortedUniqueScores[state.scoreIdx] || 0 },
            medianGpa: nextMedian
          });
        }

        if (i < sortedUniqueScores.length) {
          assignedInCat += scoreCounts[sortedUniqueScores[i]];
        }
      }
    }

    // Pruning/Sorting for Beam
    // We want to keep variety but also "good" candidates.
    // For now, let's sort by proximity to some target if provided, or just error.
    // Since we don't have "target" percentages anymore, we might just keep them all if under BEAM_WIDTH.
    currentStates = nextStates.slice(0, BEAM_WIDTH);
    if (currentStates.length === 0) break;
  }

  // Map to Results
  return currentStates.map((state, i) => {
    const meanGpa = state.totalPoints / N;
    const distributionCompliance: { label: string; compliant: boolean; actual: number }[] = [];
    for (const dist of config.distribution) {
      const groupCount = dist.labels.reduce((sum, label) => sum + (state.counts[label] || 0), 0);
      const groupPercent = (groupCount / N) * 100;
      distributionCompliance.push({
        label: dist.labels.join('+'),
        compliant: checkRange(groupPercent, dist.percentRange),
        actual: parseFloat(groupPercent.toFixed(2))
      });
    }

    return {
      id: Math.random().toString(36).substr(2, 9),
      meanGpa: parseFloat(meanGpa.toFixed(4)),
      medianGpa: state.medianGpa || 0,
      compliance: {
        mean: checkRange(meanGpa, config.aggregate.mean),
        median: checkRange(state.medianGpa || 0, config.aggregate.median),
        distribution: distributionCompliance
      },
      gradeCounts: state.counts,
      cutoffs: state.cutoffs,
      rank: i + 1
    };
  }).slice(0, config.targetResultCount);
};
