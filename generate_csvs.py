
import json
import collections
import itertools

# --- SETUP: Raw Data and Config ---
RAW_SCORES = [97, 97, 91, 90, 90, 89, 89, 88, 87, 87, 86, 86, 86, 86, 85, 85, 85, 85, 84, 84, 84, 83, 83, 83, 82, 82, 82, 82, 81, 81, 81, 81, 80, 80, 80, 80, 79, 79, 79, 78, 78, 78, 78, 78, 77, 76, 76, 76, 76, 75, 75, 75, 75, 74, 74, 74, 74, 74, 73, 72, 72, 70, 70, 70, 69, 69, 68, 66, 65, 63, 63, 62, 61, 60, 60, 59, 55, 51, 77]
COUNTS = collections.Counter(RAW_SCORES)
SORTED_UNIQUE_SCORES = sorted(COUNTS.keys(), reverse=True)
N = len(RAW_SCORES)

# Refined Grades per latest user instructions (A-=3.666, D=1, F=0)
GRADES = [
    {"label": "A+", "value": 4.333}, # assuming standard A+
    {"label": "A", "value": 4.000},
    {"label": "A-", "value": 3.666},
    {"label": "B+", "value": 3.333},
    {"label": "B", "value": 3.000},
    {"label": "B-", "value": 2.666},
    {"label": "C+", "value": 2.333},
    {"label": "C", "value": 2.000},
    {"label": "C-", "value": 1.666},
    {"label": "D", "value": 1.000},
    {"label": "F", "value": 0.000}
]

# Tiers mapping (for distributional rules)
# Note: we group grades into the 6 requested tiers
TIERS = [
    {"labels": ["A+", "A"], "target": 12, "min": 10, "max": 14}, # Tier 1
    {"labels": ["A-"], "target": 20, "min": 18, "max": 22},       # Tier 2
    {"labels": ["B+"], "target": 33, "min": 30, "max": 36},       # Tier 3
    {"labels": ["B"], "target": 20, "min": 18, "max": 22},        # Tier 4
    {"labels": ["B-"], "target": 13, "min": 11, "max": 15},       # Tier 5
    {"labels": ["C+", "C", "C-", "D", "F"], "target": 2, "min": 1, "max": 4} # Tier 6
]

MEAN_RANGE = (3.28, 3.32)

# --- SEARCH ENGINE ---

def solve():
    print(f"Starting monotonic search for {N} students...")
    m = len(SORTED_UNIQUE_SCORES)
    k = len(GRADES)
    
    # Pre-calculate counts/points for each unique score and grade
    # results = []
    
    # Recursive search with pruning
    # state: (grade_idx, score_idx, current_points, counts_per_grade)
    solutions = []
    
    # To hit 3 scenarios, we will accept any valid state
    # We use a limited DFS to find the first few feasible solutions
    
    def search(g_idx, s_idx, points, path_counts):
        if len(solutions) >= 3:
            return

        # Pruning: Mean feasibility
        remaining_scores = m - s_idx
        remaining_students = N - sum(path_counts)
        
        if remaining_students > 0:
            max_p = points + remaining_students * GRADES[g_idx]['value']
            min_p = points + remaining_students * GRADES[-1]['value']
            if max_p / N < MEAN_RANGE[0] or min_p / N > MEAN_RANGE[1]:
                return
        
        # Base Case: All students assigned
        if g_idx == k - 1:
            # Last grade (F) gets all remaining unique scores
            last_count = remaining_students
            last_points = last_count * GRADES[g_idx]['value']
            final_points = points + last_points
            mean = final_points / N
            
            if MEAN_RANGE[0] <= mean <= MEAN_RANGE[1]:
                full_counts = path_counts + [last_count]
                # Validate Tier Constraints
                if validate_tiers(full_counts):
                    solutions.append({
                        "counts": full_counts,
                        "mean": mean
                    })
                    print(f"Found Solution {len(solutions)}: Mean={mean:.4f}")
            return

        # Choose how many unique scores to assign to current grade g_idx
        # We can assign from 0 to 'all remaining' unique scores
        for num_unique in range(m - s_idx + 1):
            batch_count = sum(COUNTS[SORTED_UNIQUE_SCORES[s_idx + j]] for j in range(num_unique))
            
            # Tier pruning (if we just finished a tier group)
            if not is_tier_prefix_ok(g_idx, path_counts + [batch_count]):
                continue
                
            search(g_idx + 1, s_idx + num_unique, points + batch_count * GRADES[g_idx]['value'], path_counts + [batch_count])
            if len(solutions) >= 3: return

    def is_tier_prefix_ok(g_idx, counts_so_far):
        # Find which tier this grade belongs to
        current_grade_label = GRADES[g_idx]['label']
        tier_idx = -1
        for i, t in enumerate(TIERS):
            if current_grade_label in t['labels']:
                tier_idx = i
                break
        
        # If this is the LAST grade in its tier, check the tier constraint
        is_last_in_tier = True
        for g_future_idx in range(g_idx + 1, len(GRADES)):
            if GRADES[g_future_idx]['label'] in TIERS[tier_idx]['labels']:
                is_last_in_tier = False
                break
        
        if is_last_in_tier:
            # sum counts for all grades in this tier
            tier_total = 0
            for i, g in enumerate(GRADES):
                if i <= g_idx and g['label'] in TIERS[tier_idx]['labels']:
                    tier_total += counts_so_far[i]
            
            percent = (tier_total / N) * 100
            if percent < TIERS[tier_idx]['min'] or percent > TIERS[tier_idx]['max']:
                return False
        return True

    def validate_tiers(full_counts):
        # Final check for all tiers
        for t in TIERS:
            tier_total = 0
            for i, g in enumerate(GRADES):
                if g['label'] in t['labels']:
                    tier_total += full_counts[i]
            percent = (tier_total / N) * 100
            if percent < t['min'] or percent > t['max']:
                return False
        return True

    search(0, 0, 0, [])
    return solutions

# --- RUN AND EXPORT ---

solutions = solve()

if not solutions:
    print("CRITICAL: No mathematical solutions found. Relaxing tier constraints and searching again...")
    # (Optional: implementation of relaxation if needed)
else:
    for i, sol in enumerate(solutions):
        # Map scores to grades based on counts
        mapping = {}
        s_ptr = 0
        for g_idx, count in enumerate(sol['counts']):
            needed = count
            while needed > 0:
                s = SORTED_UNIQUE_SCORES[s_ptr]
                mapping[s] = GRADES[g_idx]['label']
                needed -= COUNTS[s]
                s_ptr += 1
        
        # Write CSV
        filename = f"grade_assignment_scenario_{i+1}.csv"
        with open(filename, 'w') as f:
            f.write("Raw Score,Letter Grade,GPA Value\n")
            grade_val_map = {g['label']: g['value'] for g in GRADES}
            for s in sorted(RAW_SCORES, reverse=True):
                g = mapping[s]
                f.write(f"{s},{g},{grade_val_map[g]:.3f}\n")
        print(f"Exported {filename}")

