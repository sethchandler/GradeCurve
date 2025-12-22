const checkRange = (val, range) => {
    if (!range)
        return true;
    if (range.min !== undefined && val < range.min - 0.0001)
        return false;
    if (range.max !== undefined && val > range.max + 0.0001)
        return false;
    return true;
};
/**
 * Top-N Dynamic Programming Algorithm for Optimal Discrete Grading
 * Implementation of the framework defined by Seth J. Chandler (2025).
 */
export const calculateDistributions = (scores, config) => {
    if (scores.length === 0)
        return [];
    // 1. Pre-Processing: Aggregate scores into unique score blocks (Section 2.1)
    const scoreCounts = {};
    scores.forEach(s => { scoreCounts[s] = (scoreCounts[s] || 0) + 1; });
    const uniqueScores = Object.keys(scoreCounts).map(Number).sort((a, b) => b - a);
    const K = uniqueScores.length;
    const N = scores.length;
    const grades = config.grades;
    const tiers = config.distribution;
    const BUFFER_N = 60; // N in the Top-N algorithm
    const GAP_PENALTY = 50; // Penalty per skipped grade category within the distribution
    const prefixCounts = new Array(K + 1).fill(0);
    for (let i = 0; i < K; i++)
        prefixCounts[i + 1] = prefixCounts[i] + scoreCounts[uniqueScores[i]];
    // Map each grade to its Tier index
    const gradeToTierIdx = grades.map(g => tiers.findIndex(t => t.labels.includes(g.label)));
    // Identify where tiers finish for validation
    const isTierEnd = grades.map((_, i) => i === grades.length - 1 || gradeToTierIdx[i] !== gradeToTierIdx[i + 1]);
    // 2. DP Trellis: dp[consumed_blocks] stores BUFFER_N paths
    let dp = Array.from({ length: K + 1 }, () => []);
    dp[0] = [{ sumGpa: 0, cumTierPenalty: 0, prevK: -1, tierStartK: 0, counts: [], cutoffs: [], hasStarted: false, pendingGaps: 0 }];
    // 3. Sequential Decision Process per Grade Level (Section 3)
    for (let gIdx = 0; gIdx < grades.length; gIdx++) {
        const nextDp = Array.from({ length: K + 1 }, () => []);
        const gVal = grades[gIdx].value;
        const tierIdx = gradeToTierIdx[gIdx];
        for (let prevK = 0; prevK <= K; prevK++) {
            if (dp[prevK].length === 0)
                continue;
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
                    }
                    else if (currentHasStarted) {
                        currentPendingGaps++;
                    }
                    if (isEnd) {
                        const range = tiers[tierIdx].percentRange;
                        if (range.min !== undefined && tierPercent < range.min) {
                            penalty += (range.min - tierPercent) * 10; // High weight for band excursion
                        }
                        else if (range.max !== undefined && tierPercent > range.max) {
                            penalty += (tierPercent - range.max) * 10;
                        }
                        // Add distance to center for smoother gradients
                        const target = ((range.min || 0) + (range.max || 0)) / 2;
                        penalty += Math.abs(tierPercent - target);
                    }
                    nextDp[currK].push({
                        sumGpa: p.sumGpa + addedGpa,
                        cumTierPenalty: penalty,
                        prevK: prevK,
                        tierStartK: isEnd ? currK : p.tierStartK,
                        counts: [...p.counts, consumed],
                        // Store the lowest score index for this grade block.
                        cutoffs: [...p.cutoffs, currK === prevK ? -1 : currK - 1],
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
                    // Rank by distribution penalty + proximity to mean potential
                    const aMean = a.sumGpa / N;
                    const bMean = b.sumGpa / N;
                    const aScore = a.cumTierPenalty + Math.abs(aMean - targetMean) * 5;
                    const bScore = b.cumTierPenalty + Math.abs(bMean - targetMean) * 5;
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
        return (a.cumTierPenalty + Math.abs(aMean - targetMean) * 10) - (b.cumTierPenalty + Math.abs(bMean - targetMean) * 10);
    })
        .slice(0, config.targetResultCount)
        .map((p, rank) => {
        const gradeCounts = {};
        const scoreCutoffs = {};
        const scoreMap = {};
        // Build cutoffs - ensuring ALL grades have a cutoff if students are assigned
        let runningTotal = 0;
        grades.forEach((g, i) => {
            gradeCounts[g.label] = p.counts[i];
            // If this grade has students, it needs a cutoff
            if (p.counts[i] > 0) {
                // The cutoff is the lowest score that gets this grade
                // Which is the score at the START of this grade's range
                if (p.cutoffs[i] !== -1) {
                    scoreCutoffs[g.label] = uniqueScores[p.cutoffs[i]];
                }
                else {
                    // This shouldn't happen if count > 0, but let's handle it
                    console.warn(`Grade ${g.label} has ${p.counts[i]} students but cutoff index is -1`);
                }
            }
            else if (i > 0 && p.counts[i - 1] > 0 && i < grades.length - 1 && p.counts[i + 1] > 0) {
                // This grade has 0 students but is between grades with students
                // Calculate what the cutoff WOULD be based on neighboring grades
                // For now, we'll leave it undefined as the algorithm does
            }
            runningTotal += p.counts[i];
        });
        // Build a sorted list of all defined cutoffs for monotonic mapping
        const definedCutoffs = [];
        grades.forEach(g => {
            if (scoreCutoffs[g.label] !== undefined) {
                definedCutoffs.push({ grade: g.label, cutoff: scoreCutoffs[g.label] });
            }
        });
        // Sort by cutoff descending (highest scores first)
        definedCutoffs.sort((a, b) => b.cutoff - a.cutoff);
        // Monotonic mapping - assign each score to the highest grade it qualifies for
        uniqueScores.forEach((s) => {
            for (const { grade, cutoff } of definedCutoffs) {
                if (s >= cutoff - 0.0001) {
                    scoreMap[s] = grade;
                    break;
                }
            }
            // If no cutoff matched, assign to lowest grade in the scale
            if (scoreMap[s] === undefined) {
                scoreMap[s] = grades[grades.length - 1].label;
            }
        });
        // Calculate Median accurately
        const allAssignedValues = [];
        grades.forEach((g, i) => {
            for (let j = 0; j < p.counts[i]; j++)
                allAssignedValues.push(g.value);
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
            scoreMap
        };
    });
};
