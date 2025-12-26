# Export Grade Assignment Bug Fix

## Problem Identified

**CRITICAL BUG**: Students were receiving incorrect grades in Excel/CSV exports. For example, students who should have received B grades were getting F grades.

### Root Cause

The bug was in [gradeEngine.ts](GradeCurve/src/services/gradeEngine.ts#L281-L293). The scoreMap used the **HIGHEST** score for each grade as the cutoff instead of the **LOWEST** score.

#### How it Worked (WRONG)

```typescript
// OLD CODE (BUGGY)
grades.forEach((g, i) => {
  gradeCounts[g.label] = p.counts[i];
  if (p.cutoffs[i] !== -1) {
    scoreCutoffs[g.label] = uniqueScores[p.cutoffs[i]];  // This was the HIGHEST score
  }
});
```

#### Example of the Bug

Scenario assigns:
- A to scores 90-100 (cutoff stored as 90, which is the HIGHEST score index in descending array)
- B to scores 80-89
- F to scores 0-79

Student with score 85:
- Check A: 85 >= 90? NO
- Check B: Would need cutoff of 80, but if B cutoff was also stored as highest score in that range, this would fail
- Falls through → F (WRONG!)

### The Fix

Changed cutoff calculation to use the **LOWEST** score for each grade:

```typescript
// NEW CODE (FIXED)
let cumulativeK = 0;
grades.forEach((g, i) => {
  gradeCounts[g.label] = p.counts[i];
  if (p.counts[i] > 0) {
    // The lowest score for this grade is at index (cumulativeK + p.counts[i] - 1)
    const lowestScoreIndex = cumulativeK + p.counts[i] - 1;
    scoreCutoffs[g.label] = uniqueScores[lowestScoreIndex];
  }
  cumulativeK += p.counts[i];
});
```

#### How it Works Now (CORRECT)

For grades A (90-100), B (80-89), C (70-79), F (0-69):
- scoreCutoffs['A'] = 90 (minimum score to get A)
- scoreCutoffs['B'] = 80 (minimum score to get B)
- scoreCutoffs['C'] = 70 (minimum score to get C)
- scoreCutoffs['F'] = 0 (minimum score to get F)

Student with score 85:
- Check A: 85 >= 90? NO
- Check B: 85 >= 80? YES → B (CORRECT!)

Student with score 72:
- Check A: 72 >= 90? NO
- Check B: 72 >= 80? NO
- Check C: 72 >= 70? YES → C (CORRECT!)

## Testing

To verify the fix:

1. Load student scores
2. Generate grade distributions
3. Export to Excel/CSV
4. Verify that each student's grade in the export matches their score against the cutoffs shown in the UI

The cutoffs shown in the ResultCard (line 46: `≥ ${cutoff.toFixed(1)}`) now correctly represent the minimum score needed to achieve that grade.

## Impact

This was a **catastrophic bug** that could have resulted in:
- Students receiving lower grades than deserved
- Major grading injustice
- Student complaints and appeals
- Academic integrity concerns

The fix ensures that grade assignments in exports exactly match the distribution algorithm's intent.

## Files Changed

- [gradeEngine.ts:281-293](GradeCurve/src/services/gradeEngine.ts#L281-L293) - Fixed cutoff calculation logic
