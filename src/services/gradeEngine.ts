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
  const grades = config.grades;
  const tiers = config.distribution;
  const targetCount = config.targetResultCount;

  const solutions: { cutoffs: Record<string, number>; mean: number; counts: Record<string, number>; score: number }[] = [];

  // Helper to find tier index for a grade label
  const getTierIdx = (label: string) => tiers.findIndex(t => t.labels.includes(label));

  // Exhaustive search over tier cutoffs (similar to Python logic)
  const numUnique = sortedUniqueScores.length;

  // Since we have 6 tiers usually, we need 5 cutoffs among unique scores
  // However, we need to handle arbitrary tiers.
  const numTiers = tiers.length;

  const searchTiers = (tierIdx: number, startScoreIdx: number, currentTierCounts: number[], currentPath: number[]) => {
    if (solutions.length >= targetCount * 5) return; // Search a bit more to find best ones

    if (tierIdx === numTiers - 1) {
      const lastTierCount = N - currentTierCounts.reduce((a, b) => a + b, 0);
      const percent = (lastTierCount / N) * 100;
      if (checkRange(percent, tiers[tierIdx].percentRange)) {
        // Found a valid tier distribution. Now split A+/A etc. if needed?
        // Actually, let's keep it simple: within each tier, we use the first grade primarily
        // unless we need to split to hit the mean (especially for A+/A).
        processTierDistribution(currentPath.concat(numUnique), currentTierCounts.concat(lastTierCount));
      }
      return;
    }

    for (let endIdx = startScoreIdx + 1; endIdx <= numUnique - (numTiers - 1 - tierIdx); endIdx++) {
      const count = sortedUniqueScores.slice(startScoreIdx, endIdx).reduce((sum, s) => sum + scoreCounts[s], 0);
      const percent = (count / N) * 100;
      if (checkRange(percent, tiers[tierIdx].percentRange)) {
        searchTiers(tierIdx + 1, endIdx, currentTierCounts.concat(count), currentPath.concat(endIdx));
      }
    }
  };

  const processTierDistribution = (tierCutoffs: number[], tierCounts: number[]) => {
    // For the A+/A tier (Tier 0), we explore splitting
    const t0Labels = tiers[0].labels;
    const t0UniqueRange = sortedUniqueScores.slice(0, tierCutoffs[0]);

    // Calculate base points from all other tiers (using first grade in each tier)
    let basePoints = 0;
    const tierGrades: string[] = [];
    for (let i = 1; i < numTiers; i++) {
      const gradeLabel = tiers[i].labels[0];
      const gradeVal = grades.find(g => g.label === gradeLabel)?.value || 0;
      basePoints += tierCounts[i] * gradeVal;
      tierGrades[i] = gradeLabel;
    }

    // Try splitting Tier 0 into the grades it contains (usually A+ and A)
    // Monotonically: Top X unique scores get first grade, rest get second, etc.
    // For simplicity, we assume Tier 0 has max 2 grades (A+, A)
    const g1 = grades.find(g => g.label === t0Labels[0]);
    const g2 = grades.find(g => g.label === t0Labels[1]) || g1;

    if (!g1 || !g2) return;

    for (let splitIdx = 0; splitIdx <= t0UniqueRange.length; splitIdx++) {
      const g1Count = t0UniqueRange.slice(0, splitIdx).reduce((sum, s) => sum + scoreCounts[s], 0);
      const g2Count = tierCounts[0] - g1Count;

      const totalPoints = basePoints + (g1Count * g1.value) + (g2Count * g2.value);
      const mean = totalPoints / N;

      if (checkRange(mean, config.aggregate.mean)) {
        // Calculate a score to rank solutions (closer to 3.30 is better)
        const targetMean = ((config.aggregate.mean?.min || 0) + (config.aggregate.mean?.max || 0)) / 2 || 3.30;
        const distError = tierCounts.reduce((err: number, count, idx) => {
          const target = ((tiers[idx].percentRange.min || 0) + (tiers[idx].percentRange.max || 0)) / 2;
          return err + Math.abs((count / N) * 100 - target);
        }, 0);

        const solutionScore = distError + Math.abs(mean - targetMean) * 100;

        const finalCutoffs: Record<string, number> = {};
        const gradeCounts: Record<string, number> = {};
        const scoreMap: Record<number, string> = {};

        // Tier 0
        t0UniqueRange.forEach((s, idx) => {
          const label = idx < splitIdx ? g1.label : g2.label;
          scoreMap[s] = label;
          if (finalCutoffs[label] === undefined) finalCutoffs[label] = s;
          gradeCounts[label] = (gradeCounts[label] || 0) + scoreCounts[s];
        });

        // Other Tiers
        let currentIdx = tierCutoffs[0];
        for (let i = 1; i < numTiers; i++) {
          const label = tierGrades[i];
          const tierScores = sortedUniqueScores.slice(currentIdx, tierCutoffs[i]);
          tierScores.forEach(s => {
            scoreMap[s] = label;
            if (finalCutoffs[label] === undefined) finalCutoffs[label] = s;
            gradeCounts[label] = (gradeCounts[label] || 0) + scoreCounts[s];
          });
          currentIdx = tierCutoffs[i];
        }

        solutions.push({
          cutoffs: finalCutoffs,
          mean,
          counts: gradeCounts,
          score: solutionScore
        });
      }
    }
  };

  searchTiers(0, 0, [], []);

  // Sort by score and return top N
  return solutions
    .sort((a, b) => a.score - b.score)
    .slice(0, targetCount)
    .map((sol, i) => {
      const compliance: DistributionResult['compliance'] = {
        mean: checkRange(sol.mean, config.aggregate.mean),
        median: true, // simplified
        distribution: tiers.map(t => {
          const count = t.labels.reduce((sum, l) => sum + (sol.counts[l] || 0), 0);
          const percent = (count / N) * 100;
          return {
            label: t.labels.join('+'),
            compliant: checkRange(percent, t.percentRange),
            actual: parseFloat(percent.toFixed(2))
          };
        })
      };

      const scoreMap: Record<number, string> = {};
      sortedUniqueScores.forEach(s => {
        for (const grade of grades) {
          if (sol.cutoffs[grade.label] !== undefined && s >= sol.cutoffs[grade.label]) {
            scoreMap[s] = grade.label;
            break;
          }
        }
      });

      return {
        id: Math.random().toString(36).substr(2, 9),
        meanGpa: parseFloat(sol.mean.toFixed(4)),
        medianGpa: 0, // todo: calculate accurately if needed
        compliance,
        gradeCounts: sol.counts,
        cutoffs: sol.cutoffs,
        rank: i + 1,
        scoreMap
      };
    });
};
