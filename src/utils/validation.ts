import { GradeEngineConfig } from '../types';

export function validateConfig(config: GradeEngineConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // 1. Check that distribution percentages can sum to 100%
  const minSum = config.distribution.reduce((sum, tier) => sum + (tier.percentRange.min || 0), 0);
  const maxSum = config.distribution.reduce((sum, tier) => sum + (tier.percentRange.max || 100), 0);
  
  if (minSum > 100.01) { // Small tolerance for floating point
    errors.push(`Minimum percentages sum to ${minSum.toFixed(1)}% but cannot exceed 100%`);
  }
  if (maxSum < 99.99) {
    errors.push(`Maximum percentages sum to ${maxSum.toFixed(1)}% but must reach at least 100%`);
  }
  
  // 2. Check that mean GPA is achievable with the distribution constraints
  if (config.aggregate.mean) {
    const { min: minPossibleGPA, max: maxPossibleGPA } = calculateMinMaxGPA(config);
    
    if (config.aggregate.mean.min && config.aggregate.mean.min < minPossibleGPA - 0.01) {
      errors.push(`Target mean minimum ${config.aggregate.mean.min.toFixed(3)} is below achievable minimum ${minPossibleGPA.toFixed(3)}`);
    }
    if (config.aggregate.mean.max && config.aggregate.mean.max > maxPossibleGPA + 0.01) {
      errors.push(`Target mean maximum ${config.aggregate.mean.max.toFixed(3)} is above achievable maximum ${maxPossibleGPA.toFixed(3)}`);
    }
  }
  
  // 3. Check that all grades referenced in distribution exist
  const gradeLabels = new Set(config.grades.map(g => g.label));
  config.distribution.forEach((tier, idx) => {
    tier.labels.forEach(label => {
      if (!gradeLabels.has(label)) {
        errors.push(`Tier ${idx + 1} references undefined grade "${label}"`);
      }
    });
  });
  
  // 4. Check that all grades are used in some tier
  const usedGrades = new Set<string>();
  config.distribution.forEach(tier => {
    tier.labels.forEach(label => usedGrades.add(label));
  });
  config.grades.forEach(grade => {
    if (!usedGrades.has(grade.label)) {
      errors.push(`Grade "${grade.label}" is defined but not assigned to any distribution tier`);
    }
  });
  
  // 5. Check for reasonable grade values (should be between 0 and 4.333)
  config.grades.forEach(grade => {
    if (grade.value < 0 || grade.value > 4.5) {
      errors.push(`Grade "${grade.label}" has unusual value ${grade.value} (expected 0-4.333)`);
    }
  });
  
  return { valid: errors.length === 0, errors };
}

function calculateMinMaxGPA(config: GradeEngineConfig): { min: number; max: number } {
  // Calculate the theoretical min/max GPA given the distribution constraints
  
  let minGPA = 0;
  let maxGPA = 0;
  
  // For max GPA: use highest grade in each tier at maximum percentage
  for (const tier of config.distribution) {
    const tierGrades = tier.labels.map(l => config.grades.find(g => g.label === l)!).filter(Boolean);
    if (tierGrades.length === 0) continue;
    
    const highestInTier = Math.max(...tierGrades.map(g => g.value));
    const percentForTier = tier.percentRange.max || 0;
    maxGPA += (percentForTier / 100) * highestInTier;
  }
  
  // For min GPA: use lowest grade in each tier at minimum percentage
  for (const tier of config.distribution) {
    const tierGrades = tier.labels.map(l => config.grades.find(g => g.label === l)!).filter(Boolean);
    if (tierGrades.length === 0) continue;
    
    const lowestInTier = Math.min(...tierGrades.map(g => g.value));
    const percentForTier = tier.percentRange.min || 0;
    minGPA += (percentForTier / 100) * lowestInTier;
  }
  
  return { min: minGPA, max: maxGPA };
}
