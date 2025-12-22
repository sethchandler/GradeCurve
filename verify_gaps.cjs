const { calculateDistributions } = require('./src/services/gradeEngine.ts');
const { EMORY_LAW_CONFIG } = require('./src/constants.ts');

// Mock scores that might lead to a gap if not penalized
// 50 students, high concentration in middle
const scores = Array.from({ length: 50 }, (_, i) => 70 + Math.random() * 20);

// We want to see if the engine skips A- or B
const results = calculateDistributions(scores, EMORY_LAW_CONFIG);

console.log(`Generated ${results.length} scenarios.`);

results.forEach((res, i) => {
    console.log(`\nScenario ${i + 1} (Mean: ${res.meanGpa}):`);
    const counts = res.gradeCounts;
    const grades = Object.keys(counts);

    let hasGap = false;
    let started = false;
    let gaps = [];

    // Check for gaps between non-zero grades
    grades.forEach(g => {
        if (counts[g] > 0) {
            started = true;
            if (gaps.length > 0) {
                console.log(`  !! GAP DETECTED: ${gaps.join(', ')}`);
                hasGap = true;
                gaps = [];
            }
        } else if (started) {
            gaps.push(g);
        }
    });

    if (!hasGap) {
        console.log("  Smooth distribution (no gaps within the assigned range).");
    }

    console.log("  Counts:", JSON.stringify(counts));
});
