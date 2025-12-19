
import json
import collections
import itertools

def solve():
    with open('config.json', 'r') as f:
        config = json.load(f)

    raw_scores = [97, 97, 91, 90, 90, 89, 89, 88, 87, 87, 86, 86, 86, 86, 85, 85, 85, 85, 84, 84, 84, 83, 83, 83, 82, 82, 82, 82, 81, 81, 81, 81, 80, 80, 80, 80, 79, 79, 79, 78, 78, 78, 78, 78, 77, 76, 76, 76, 76, 75, 75, 75, 75, 74, 74, 74, 74, 74, 73, 72, 72, 70, 70, 70, 69, 69, 68, 66, 65, 63, 63, 62, 61, 60, 60, 59, 55, 51, 77]
    counts = collections.Counter(raw_scores)
    sorted_unique = sorted(counts.keys(), reverse=True)
    n_total = len(raw_scores)
    
    grades = config['grades']
    tier_defs = config['distribution']
    mean_min = config['aggregate']['mean']['min']
    mean_max = config['aggregate']['mean']['max']
    targets = [12, 20, 33, 20, 13, 2] # Recommended % per tier

    num_unique = len(sorted_unique)
    best_results = []
    
    # Tier structure:
    # 0: A/A+, 1: A-, 2: B+, 3: B, 4: B-, 5: C tier
    
    # We iterate through all possible cutoff combinations for the 6 tiers
    for cutoffs in itertools.combinations(range(1, num_unique), 5):
        c = [0] + list(cutoffs) + [num_unique]
        tier_counts = []
        for i in range(6):
            tier_scores = sorted_unique[c[i]:c[i+1]]
            tier_counts.append(sum(counts[s] for s in tier_scores))
            
        # 1. Distribution check (Slack: 4%)
        dist_errors = 0
        dist_ok = True
        for i in range(6):
            p = (tier_counts[i] / n_total) * 100
            error = abs(p - targets[i])
            dist_errors += error
            # If any tier is wildly off, skip
            if error > 4.5:
                dist_ok = False
                break
        if not dist_ok: continue
            
        # 2. Mean check + A+ optimization
        # We need to split Tier 0 into A+ and A.
        # Monotonicity: Top N unique scores in Tier 0 must be A+, the rest A.
        t0_unique_count = c[1] - c[0]
        
        base_points = (tier_counts[1]*3.666 + tier_counts[2]*3.333 + 
                       tier_counts[3]*3.0 + tier_counts[4]*2.666 + 
                       tier_counts[5]*2.0)
        
        # We can decide how many UNIQUE scores in Tier 0 are assigned A+ (monotonic)
        # range(1, ...) ensures at least the top unique score (the 97s) get A+
        for num_aplus_unique in range(1, t0_unique_count + 1):
            aplus_count = sum(counts[sorted_unique[j]] for j in range(num_aplus_unique))
            a_count = tier_counts[0] - aplus_count
            
            total_points = base_points + aplus_count*4.333 + a_count*4.0
            mean = total_points / n_total
            
            if mean_min <= mean <= mean_max:
                # Score: lower is better. 
                # Prioritize distribution match, then mean match.
                score = dist_errors + abs(mean - 3.30)*50
                
                best_results.append({
                    'cutoffs': cutoffs,
                    'num_aplus_unique': num_aplus_unique,
                    'mean': mean,
                    'dist_errors': dist_errors,
                    'score': score
                })

    # Sort and pick top 3
    best_results.sort(key=lambda x: x['score'])
    
    tier_labels = [['A-',], ['B+',], ['B',], ['B-',], ['C+', 'C', 'C-', 'D', 'F']]
    for i, res in enumerate(best_results[:3]):
        c = [0] + list(res['cutoffs']) + [num_unique]
        score_map = {}
        
        # Monotonic Tier 0 split
        for j in range(c[0], c[1]):
            s = sorted_unique[j]
            score_map[s] = 'A+' if (j - c[0]) < res['num_aplus_unique'] else 'A'
            
        for t_idx in range(1, 6):
            t_scores = sorted_unique[c[t_idx]:c[t_idx+1]]
            label = tier_labels[t_idx-1][0]
            for s in t_scores:
                score_map[s] = label
        
        # Write CSV
        filename = f"grade_assignment_scenario_{i+1}.csv"
        csv_text = "Raw Score,Letter Grade,GPA Value\n"
        grade_vals = {g['label']: g['value'] for g in grades}
        for s in sorted(raw_scores, reverse=True):
            g = score_map[s]
            csv_text += f"{s},{g},{grade_vals[g]:.3f}\n"
            
        with open(filename, 'w') as f:
            f.write(csv_text)
        print(f"Scenario {i+1} Mean: {res['mean']:.4f}, A+ Recipients: {res['num_aplus_unique']} scores")

solve()
