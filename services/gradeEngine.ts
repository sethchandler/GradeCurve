
import { 
  GradeCategory, 
  DistributionResult, 
  GradeEngineConfig 
} from '../types';

interface SearchState {
  scoreIdx: number;
  currentPoints: number;
  currentCount: number;
  distError: number;
  cutoffs: Record<string, number>;
  counts: Record<string, number>;
}

/**
 * GradeCurve Engine v4.0 - Beam Search Implementation
 * High performance, non-blocking, strict GPA compliance [3.28 - 3.32].
 */
export const calculateDistributions = (
  scores: number[],
  config: GradeEngineConfig,
  limit: number = 3
): DistributionResult[] => {
  if (scores.length === 0) return [];

  // Group scores to ensure ties aren't split
  const scoreCounts: Record<number, number> = {};
  scores.forEach(s => { scoreCounts[s] = (scoreCounts[s] || 0) + 1; });

  const sortedUniqueScores = Object.keys(scoreCounts)
    .map(Number)
    .sort((a, b) => b - a);

  const totalStudents = scores.length;
  const minTargetPoints = 3.28 * totalStudents;
  const maxTargetPoints = 3.32 * totalStudents;
  
  const gpaValues = config.categories.map(c => c.gpaValue);
  const targetPercents = config.categories.map(c => c.targetPercent);
  
  // Pre-calculate target cumulative counts
  let sumP = 0;
  const targetCumulativeCounts = targetPercents.map(p => {
    sumP += p;
    return (sumP / 100) * totalStudents;
  });

  // Initial state: Level 0 (A+), 0 students assigned
  let currentStates: SearchState[] = [{
    scoreIdx: 0,
    currentPoints: 0,
    currentCount: 0,
    distError: 0,
    cutoffs: {},
    counts: {}
  }];

  const BEAM_WIDTH = 200; // Only keep the top 200 paths at each grade level

  // Iterate through each grade category (A+ -> F)
  for (let catIdx = 0; catIdx < config.categories.length; catIdx++) {
    const nextStates: SearchState[] = [];
    const isLast = catIdx === config.categories.length - 1;
    const catLabel = config.categories[catIdx].label;
    const targetCum = targetCumulativeCounts[catIdx];
    const targetPct = targetPercents[catIdx];

    for (const state of currentStates) {
      if (isLast) {
        // BASE CASE: Assign all remaining students to the last category (F)
        const remainingCount = totalStudents - state.currentCount;
        const finalPoints = state.currentPoints + (remainingCount * gpaValues[catIdx]);
        
        // Final GPA Check
        if (finalPoints >= minTargetPoints - 0.0001 && finalPoints <= maxTargetPoints + 0.0001) {
          const actualPct = (remainingCount / totalStudents) * 100;
          const finalError = state.distError + Math.abs(actualPct - targetPct);
          
          nextStates.push({
            ...state,
            currentPoints: finalPoints,
            currentCount: totalStudents,
            distError: finalError,
            cutoffs: { ...state.cutoffs, [catLabel]: sortedUniqueScores[sortedUniqueScores.length - 1] || 0 },
            counts: { ...state.counts, [catLabel]: remainingCount }
          });
        }
        continue;
      }

      // EXPLORE: Try different cutoff points for this category
      // Window: Center around target percentage, but allow flexibility
      const windowSize = Math.max(12, totalStudents * 0.2); 
      let assignedInCat = 0;
      
      // OPTIMIZATION: Start from current scoreIdx
      for (let i = state.scoreIdx; i <= sortedUniqueScores.length; i++) {
        const studentCountSoFar = state.currentCount + assignedInCat;
        const diffFromTarget = Math.abs(studentCountSoFar - targetCum);

        if (diffFromTarget <= windowSize || i === state.scoreIdx) {
          const nextPoints = state.currentPoints + (assignedInCat * gpaValues[catIdx]);
          const actualPct = (assignedInCat / totalStudents) * 100;
          
          nextStates.push({
            scoreIdx: i,
            currentPoints: nextPoints,
            currentCount: studentCountSoFar,
            distError: state.distError + Math.abs(actualPct - targetPct),
            cutoffs: { ...state.cutoffs, [catLabel]: sortedUniqueScores[state.scoreIdx] || 0 },
            counts: { ...state.counts, [catLabel]: assignedInCat }
          });
        }

        if (i < sortedUniqueScores.length) {
          assignedInCat += scoreCounts[sortedUniqueScores[i]];
        }
        
        // Break if we are far past the cumulative window
        if (studentCountSoFar > targetCum + windowSize) break;
      }
    }

    // PRUNING: Keep only the best BEAM_WIDTH states for the next level
    // Rank by a combination of distribution error and "estimated" GPA feasibility
    currentStates = nextStates
      .sort((a, b) => a.distError - b.distError)
      .slice(0, BEAM_WIDTH);
      
    if (currentStates.length === 0) break;
  }

  // FINAL RESULTS: Sort the survivors by distribution error
  return currentStates
    .sort((a, b) => a.distError - b.distError)
    .slice(0, limit)
    .map((r, i) => ({
      id: Math.random().toString(36).substr(2, 9),
      meanGpa: parseFloat((r.currentPoints / totalStudents).toFixed(4)),
      meanDeviation: Math.abs((r.currentPoints / totalStudents) - config.targetMean),
      distributionError: parseFloat(r.distError.toFixed(2)),
      gradeCounts: r.counts,
      cutoffs: r.cutoffs,
      rank: i + 1
    }));
};
