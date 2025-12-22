
const XLSX = require('xlsx');

// Mock types/constants for testing
const EMORY_LAW_CONFIG = {
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
        { labels: ['A+', 'A'], percentRange: { min: 11, max: 13 } },
        { labels: ['A-'], percentRange: { min: 18, max: 22 } },
        { labels: ['B+'], percentRange: { min: 30, max: 36 } },
        { labels: ['B'], percentRange: { min: 18, max: 22 } },
        { labels: ['B-'], percentRange: { min: 11, max: 15 } },
        { labels: ['C+', 'C', 'C-', 'D', 'F'], percentRange: { min: 1, max: 3 } }
    ],
    targetResultCount: 3
};

const checkRange = (val, range) => {
    if (!range) return true;
    if (range.min !== undefined && val < range.min - 0.0001) return false;
    if (range.max !== undefined && val > range.max + 0.0001) return false;
    return true;
};

function calculateDistributions(scores, config) {
    if (scores.length === 0) return [];
    const scoreCounts = {};
    scores.forEach(s => { scoreCounts[s] = (scoreCounts[s] || 0) + 1; });
    const uniqueScores = Object.keys(scoreCounts).map(Number).sort((a, b) => b - a);
    const K = uniqueScores.length;
    const N = scores.length;
    const grades = config.grades;
    const tiers = config.distribution;
    const BUFFER_N = 60;

    const prefixCounts = new Array(K + 1).fill(0);
    for (let i = 0; i < K; i++) prefixCounts[i + 1] = prefixCounts[i] + scoreCounts[uniqueScores[i]];

    const gradeToTierIdx = grades.map(g => tiers.findIndex(t => t.labels.includes(g.label)));
    const isTierEnd = grades.map((_, i) => i === grades.length - 1 || gradeToTierIdx[i] !== gradeToTierIdx[i + 1]);

    let dp = Array.from({ length: K + 1 }, () => []);
    dp[0] = [{ sumGpa: 0, cumTierPenalty: 0, prevK: -1, tierStartK: 0, counts: [], cutoffs: [] }];

    for (let gIdx = 0; gIdx < grades.length; gIdx++) {
        const nextDp = Array.from({ length: K + 1 }, () => []);
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
                    if (isEnd) {
                        const range = tiers[tierIdx].percentRange;
                        if (range.min !== undefined && tierPercent < range.min) {
                            penalty += (range.min - tierPercent) * 10;
                        } else if (range.max !== undefined && tierPercent > range.max) {
                            penalty += (tierPercent - range.max) * 10;
                        }
                        const target = ((range.min || 0) + (range.max || 0)) / 2;
                        penalty += Math.abs(tierPercent - target);
                    }

                    nextDp[currK].push({
                        sumGpa: p.sumGpa + addedGpa,
                        cumTierPenalty: penalty,
                        prevK: prevK,
                        tierStartK: isEnd ? currK : p.tierStartK,
                        counts: [...p.counts, consumed],
                        cutoffs: [...p.cutoffs, currK === prevK ? -1 : prevK]
                    });
                }
            }
        }

        const targetMean = ((config.aggregate.mean.min || 0) + (config.aggregate.mean.max || 0)) / 2 || 3.30;
        for (let k = 0; k <= K; k++) {
            if (nextDp[k].length > BUFFER_N) {
                nextDp[k].sort((a, b) => {
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

    // Final check: Use the mean as a hard filter if possible, otherwise find closest
    let solutions = dp[K].filter(p => checkRange(p.sumGpa / N, config.aggregate.mean));
    if (solutions.length === 0) {
        console.log("No exact mean matches. Finding closest...");
        solutions = dp[K];
    }

    const targetMeanVal = ((config.aggregate.mean.min || 0) + (config.aggregate.mean.max || 0)) / 2 || 3.30;

    return solutions
        .sort((a, b) => {
            const aMean = a.sumGpa / N;
            const bMean = b.sumGpa / N;
            return (a.cumTierPenalty + Math.abs(aMean - targetMeanVal) * 100) - (b.cumTierPenalty + Math.abs(bMean - targetMeanVal) * 100);
        })
        .slice(0, config.targetResultCount);
}

// 1. Load Bob's Grades
const wb = XLSX.readFile('/home/seth/Downloads/bob-grades.xlsx');
const sheet = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

let headerIndex = rows.findIndex(row =>
    row.filter(cell => cell !== null && cell !== undefined && String(cell).trim() !== '').length > 2
);
const headerRow = rows[headerIndex].map(h => String(h || '').trim());
const dataRows = rows.slice(headerIndex + 1);
const totalColIdx = headerRow.indexOf('Total');

const scores = dataRows
    .map(row => Number(row[totalColIdx]))
    .filter(n => !isNaN(n));

console.log(`Processing ${scores.length} student scores...`);

// 2. Run Engine
const results = calculateDistributions(scores, EMORY_LAW_CONFIG);

if (results.length === 0) {
    console.log("No valid solutions found.");
} else {
    results.forEach((sol, i) => {
        const mean = sol.sumGpa / scores.length;
        console.log(`\nScenario ${i + 1}:`);
        console.log(`Mean GPA: ${mean.toFixed(4)}`);
        console.log(`Penalty Score: ${sol.cumTierPenalty.toFixed(2)}`);

        let currentTierIdx = -1;
        EMORY_LAW_CONFIG.grades.forEach((g, idx) => {
            if (sol.counts[idx] > 0) {
                console.log(`  ${g.label}: ${sol.counts[idx]} students (${((sol.counts[idx] / scores.length) * 100).toFixed(1)}%)`);
            }
        });
    });
}
