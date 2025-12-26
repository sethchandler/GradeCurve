import {
  GradeEngineConfig,
  DistributionResult,
  Range,
} from '../types';

const checkRange = (val: number, range?: Range): boolean => {
  if (!range) return true;
  if (range.min !== undefined && val < range.min - 0.0001) return false;
  if (range.max !== undefined && val > range.max + 0.0001) return false;
  return true;
};

/**
 * Top-N Dynamic Programming Algorithm for Optimal Discrete Grading
 * Implementation of the framework defined by Seth J. Chandler (2025).
 */
export const calculateDistributions = (
  scores: number[],
  config: GradeEngineConfig
): DistributionResult[] => {
  if (scores.length === 0) return [];

  // 1. Pre-Processing: Aggregate scores into unique score blocks (Section 2.1)
  const scoreCounts: Record<number, number> = {};
  scores.forEach(s => { scoreCounts[s] = (scoreCounts[s] || 0) + 1; });
  const uniqueScores = Object.keys(scoreCounts).map(Number).sort((a, b) => b - a);
  const K = uniqueScores.length;
  const N = scores.length;
  const grades = config.grades;
  const tiers = config.distribution;
  const BUFFER_N = 60; // N in the Top-N algorithm
  const GAP_PENALTY = 50; // Penalty per skipped grade category within the distribution

  const prefixCounts = new Array(K + 1).fill(0);
  for (let i = 0; i < K; i++) prefixCounts[i + 1] = prefixCounts[i] + scoreCounts[uniqueScores[i]];

  // Map each grade to its Tier index
  const gradeToTierIdx = grades.map(g => tiers.findIndex(t => t.labels.includes(g.label)));
  // Identify where tiers finish for validation
  const isTierEnd = grades.map((_, i) => i === grades.length - 1 || gradeToTierIdx[i] !== gradeToTierIdx[i + 1]);

  /**
   * Calculate distribution shape penalty to discourage bimodal distributions.
   * Returns a penalty score where higher values indicate worse (more bimodal) distributions.
   */
  const calculateShapePenalty = (counts: number[]): number => {
    if (counts.length === 0) return 0;

    const total = counts.reduce((a, b) => a + b, 0);
    if (total === 0) return 0;

    // Calculate distribution statistics
    const proportions = counts.map(c => c / total);

    // 1. BIMODALITY COEFFICIENT
    // BC = (skewness² + 1) / kurtosis
    // BC > 0.55 suggests bimodality (for continuous distributions)
    // We adapt this for discrete distributions

    // Calculate mean index (center of mass)
    const meanIdx = proportions.reduce((sum, p, i) => sum + p * i, 0);

    // Calculate variance
    const variance = proportions.reduce((sum, p, i) => sum + p * Math.pow(i - meanIdx, 2), 0);
    const stdDev = Math.sqrt(variance);

    // Calculate skewness (third moment)
    const skewness = stdDev === 0 ? 0 :
      proportions.reduce((sum, p, i) => sum + p * Math.pow((i - meanIdx) / stdDev, 3), 0);

    // Calculate kurtosis (fourth moment)
    const kurtosis = stdDev === 0 ? 0 :
      proportions.reduce((sum, p, i) => sum + p * Math.pow((i - meanIdx) / stdDev, 4), 0);

    // Bimodality coefficient (adjusted for small sample discrete distributions)
    const bc = kurtosis > 0.001 ? (skewness * skewness + 1) / kurtosis : 0;

    // For unimodal distributions: BC ≈ 0.55 for uniform, < 0.55 for normal
    // For bimodal distributions: BC > 0.55
    // Penalty increases as BC exceeds the unimodal threshold
    const bimodalityPenalty = Math.max(0, (bc - 0.56) * 100);

    // 2. VALLEY DETECTION PENALTY
    // Penalize distributions with "valleys" (low counts in the middle)
    // This catches U-shaped distributions where students cluster at extremes
    let valleyPenalty = 0;
    if (counts.length >= 5) {
      // Find peaks (local maxima)
      const peaks: number[] = [];
      for (let i = 0; i < counts.length; i++) {
        const isLocalMax =
          (i === 0 || counts[i] >= counts[i-1]) &&
          (i === counts.length - 1 || counts[i] >= counts[i+1]);
        if (isLocalMax && counts[i] > 0) peaks.push(i);
      }

      // If we have 2+ peaks separated by a valley, penalize
      if (peaks.length >= 2) {
        const firstPeak = peaks[0];
        const lastPeak = peaks[peaks.length - 1];

        // Find minimum between first and last peak
        let minValleyCount = Infinity;
        let minValleyIdx = -1;
        for (let i = firstPeak + 1; i < lastPeak; i++) {
          if (counts[i] < minValleyCount) {
            minValleyCount = counts[i];
            minValleyIdx = i;
          }
        }

        // If valley is significantly lower than peaks, penalize
        if (minValleyIdx !== -1) {
          const avgPeakHeight = (counts[firstPeak] + counts[lastPeak]) / 2;
          const valleyDepth = avgPeakHeight - minValleyCount;

          // Penalize if valley is at least 30% lower than average peak
          if (valleyDepth > avgPeakHeight * 0.3) {
            valleyPenalty = valleyDepth * 5;
          }
        }
      }
    }

    // 3. CONCENTRATION AT EXTREMES PENALTY
    // Penalize when too many students are at the top and bottom grades
    let extremesPenalty = 0;
    if (counts.length >= 4) {
      // Check top 2 and bottom 2 grades
      const topCount = counts[0] + counts[1];
      const bottomCount = counts[counts.length - 1] + counts[counts.length - 2];
      const extremesTotal = topCount + bottomCount;
      const extremesProportion = extremesTotal / total;

      // If more than 60% of students are in top 2 or bottom 2 grades, penalize
      if (extremesProportion > 0.6) {
        extremesPenalty = (extremesProportion - 0.6) * 150;
      }
    }

    // 4. MULTIMODALITY PENALTY (detecting multiple peaks)
    // Count the number of distinct peaks
    let peakCount = 0;
    for (let i = 0; i < counts.length; i++) {
      if (counts[i] === 0) continue;

      const isLocalMax =
        (i === 0 || counts[i] > counts[i-1]) &&
        (i === counts.length - 1 || counts[i] > counts[i+1]);

      // Only count significant peaks (at least 5% of total)
      if (isLocalMax && counts[i] >= total * 0.05) {
        peakCount++;
      }
    }

    // Penalize having more than 1 significant peak
    const multimodalPenalty = Math.max(0, (peakCount - 1) * 30);

    return bimodalityPenalty + valleyPenalty + extremesPenalty + multimodalPenalty;
  };

  interface Path {
    sumGpa: number;
    cumTierPenalty: number;
    shapePenalty: number; // Penalty for bimodal/irregular distributions
    prevK: number;
    tierStartK: number; // Block index where current tier started
    counts: number[];
    cutoffs: number[]; // Unique score index per grade
    hasStarted: boolean; // True if we have assigned students to a grade already
    pendingGaps: number; // Count of grades assigned 0 students since the last non-zero grade
  }

  // 2. DP Trellis: dp[consumed_blocks] stores BUFFER_N paths
  let dp: Path[][] = Array.from({ length: K + 1 }, () => []);
  dp[0] = [{ sumGpa: 0, cumTierPenalty: 0, shapePenalty: 0, prevK: -1, tierStartK: 0, counts: [], cutoffs: [], hasStarted: false, pendingGaps: 0 }];

  // 3. Sequential Decision Process per Grade Level (Section 3)
  for (let gIdx = 0; gIdx < grades.length; gIdx++) {
    const nextDp: Path[][] = Array.from({ length: K + 1 }, () => []);
    const gVal = grades[gIdx].value;
    const tierIdx = gradeToTierIdx[gIdx];

    for (let prevK = 0; prevK <= K; prevK++) {
      if (dp[prevK].length === 0) continue;

      for (let currK = prevK; currK <= K; currK++) {
        const consumed = prefixCounts[currK] - prefixCounts[prevK];
        const addedGpa = consumed * gVal;
        const isEnd = isTierEnd[gIdx];

        for (const p of dp[prevK]) {
          const totalInTier = (prefixCounts[currK] - prefixCounts[p.tierStartK]);
          const tierPercent = (totalInTier / N) * 100;

          // Soft Constraint Penalty (Section 2.2)
          let penalty = p.cumTierPenalty;

          // Gap Penalty: Penalize skipping grades within the range
          let currentPendingGaps = p.pendingGaps;
          let currentHasStarted = p.hasStarted;

          if (consumed > 0) {
            if (currentHasStarted && currentPendingGaps > 0) {
              penalty += currentPendingGaps * GAP_PENALTY;
            }
            currentHasStarted = true;
            currentPendingGaps = 0;
          } else if (currentHasStarted) {
            currentPendingGaps++;
          }

          if (isEnd) {
            const range = tiers[tierIdx].percentRange;
            if (range.min !== undefined && tierPercent < range.min) {
              penalty += (range.min - tierPercent) * 10; // High weight for band excursion
            } else if (range.max !== undefined && tierPercent > range.max) {
              penalty += (tierPercent - range.max) * 10;
            }

            // Add distance to center for smoother gradients
            const target = ((range.min || 0) + (range.max || 0)) / 2;
            penalty += Math.abs(tierPercent - target);
          }

          // Calculate shape penalty for current distribution
          const newCounts = [...p.counts, consumed];
          const newShapePenalty = calculateShapePenalty(newCounts);

          nextDp[currK].push({
            sumGpa: p.sumGpa + addedGpa,
            cumTierPenalty: penalty,
            shapePenalty: newShapePenalty,
            prevK: prevK,
            tierStartK: isEnd ? currK : p.tierStartK,
            counts: newCounts,
            cutoffs: [...p.cutoffs, currK === prevK ? -1 : prevK],
            hasStarted: currentHasStarted,
            pendingGaps: currentPendingGaps
          });
        }
      }
    }

    // Leaderboard Pruning: Keep N most promising paths per state
    const targetMean = ((config.aggregate.mean?.min || 0) + (config.aggregate.mean?.max || 0)) / 2 || 3.30;
    for (let k = 0; k <= K; k++) {
      if (nextDp[k].length > BUFFER_N) {
        nextDp[k].sort((a, b) => {
          // Rank by distribution penalty + shape penalty + proximity to mean potential
          const aMean = a.sumGpa / N;
          const bMean = b.sumGpa / N;
          const aScore = a.cumTierPenalty + a.shapePenalty + Math.abs(aMean - targetMean) * 5;
          const bScore = b.cumTierPenalty + b.shapePenalty + Math.abs(bMean - targetMean) * 5;
          return aScore - bScore;
        });
        nextDp[k] = nextDp[k].slice(0, BUFFER_N);
      }
    }
    dp = nextDp;
  }

  // 4. Extract Resulting Distributions
  const solutions = dp[K].filter(p => checkRange(p.sumGpa / N, config.aggregate.mean));
  const targetMean = ((config.aggregate.mean?.min || 0) + (config.aggregate.mean?.max || 0)) / 2 || 3.30;

  return solutions
    .sort((a, b) => {
      const aMean = a.sumGpa / N;
      const bMean = b.sumGpa / N;
      return (a.cumTierPenalty + a.shapePenalty + Math.abs(aMean - targetMean) * 10) - (b.cumTierPenalty + b.shapePenalty + Math.abs(bMean - targetMean) * 10);
    })
    .slice(0, config.targetResultCount)
    .map((p, rank) => {
      const gradeCounts: Record<string, number> = {};
      const scoreCutoffs: Record<string, number> = {};
      const scoreMap: Record<number, string> = {};

      // Build grade counts first
      grades.forEach((g, i) => {
        gradeCounts[g.label] = p.counts[i];
      });

      // Build intervals from the cutoffs stored during DP
      // The DP algorithm stores cutoff indices in p.cutoffs
      // We need to reconstruct which scores belong to which grade

      // First, let's create a score-to-grade assignment for ALL scores
      const allScores = [...scores].sort((a, b) => b - a); // All scores, sorted desc
      const gradeAssignments: string[] = new Array(N);

      // Assign grades based on the counts from the DP solution
      let scoreIndex = 0;
      grades.forEach((g, gradeIdx) => {
        const count = p.counts[gradeIdx];
        for (let i = 0; i < count; i++) {
          if (scoreIndex < N) {
            gradeAssignments[scoreIndex] = g.label;
            scoreIndex++;
          }
        }
      });

      // Build scoreMap using SORTED scores with their assignments
      allScores.forEach((score, idx) => {
        const grade = gradeAssignments[idx];
        if (grade) {
          scoreMap[score] = grade;
        }
      });

      // Build intervals for each grade (find min/max score for each grade)
      const gradeRanges: Record<string, {min: number, max: number}> = {};

      allScores.forEach((score, idx) => {
        const grade = gradeAssignments[idx];
        if (grade) {
          if (!gradeRanges[grade]) {
            gradeRanges[grade] = { min: score, max: score };
          } else {
            gradeRanges[grade].min = Math.min(gradeRanges[grade].min, score);
            gradeRanges[grade].max = Math.max(gradeRanges[grade].max, score);
          }
        }
      });

      // CRITICAL: Add a grade lookup function that handles ANY score (including fractional)
      // This function will be stored in the result for use during export
      const getGradeForScore = (score: number): string => {
        // Check exact match first (for efficiency)
        if (scoreMap[score]) return scoreMap[score];

        // For fractional or unknown scores, find which range it falls into
        // Grades are ordered from highest to lowest in the config
        for (const grade of grades) {
          const range = gradeRanges[grade.label];
          if (range && score >= range.min - 0.0001 && score <= range.max + 0.0001) {
            return grade.label;
          }
        }

        // If no range matches, return the lowest grade (shouldn't happen with valid data)
        return grades[grades.length - 1].label;
      };

      // Store cutoffs for display
      Object.entries(gradeRanges).forEach(([grade, range]) => {
        scoreCutoffs[grade] = range.min;
      });

      // DEBUG: Log assignments for scenario 1
      if (rank === 0) {
        console.log('[GradeCurve] Grade distribution for top scenario:');
        Object.entries(gradeCounts).forEach(([grade, count]) => {
          if (count > 0) {
            const range = gradeRanges[grade];
            if (range) {
              console.log(`  ${grade}: [${range.min}, ${range.max}] (${count} students)`);
            }
          }
        });

        console.log('[GradeCurve] Sample score mappings:');
        const sampleScores = Object.keys(scoreMap).map(Number).sort((a,b) => b-a).slice(0, 10);
        sampleScores.forEach(score => {
          console.log(`  ${score} -> ${scoreMap[score]}`);
        });
      }

      // Calculate Median accurately
      const allAssignedValues: number[] = [];
      grades.forEach((g, i) => {
        for (let j = 0; j < p.counts[i]; j++) allAssignedValues.push(g.value);
      });
      allAssignedValues.sort((a, b) => b - a);
      const mid = Math.floor(N / 2);
      const median = N % 2 !== 0 ? allAssignedValues[mid] : (allAssignedValues[mid - 1] + allAssignedValues[mid]) / 2;

      return {
        id: Math.random().toString(36).substr(2, 9),
        meanGpa: parseFloat((p.sumGpa / N).toFixed(4)),
        medianGpa: parseFloat(median.toFixed(4)),
        compliance: {
          mean: true,
          median: true,
          distribution: tiers.map(t => {
            const count = t.labels.reduce((acc, lbl) => acc + (gradeCounts[lbl] || 0), 0);
            const actual = (count / N) * 100;
            return {
              label: t.labels.join('+'),
              actual: parseFloat(actual.toFixed(2)),
              compliant: checkRange(actual, t.percentRange)
            };
          })
        },
        gradeCounts,
        cutoffs: scoreCutoffs,
        rank: rank + 1,
        scoreMap,
        getGradeForScore
      };
    });
};
