
import json
import csv
import collections

def check_csv(filename, config_filename):
    print(f"\n--- triple-check Verification for {filename} ---")
    data = []
    with open(filename, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            data.append({
                'score': int(row['Raw Score']),
                'grade': row['Letter Grade'],
                'gpa': float(row['GPA Value'])
            })
    
    n = len(data)
    
    # 1. Monotonicity check (CRITICAL)
    # The list should be sorted by score descending. Check if GPA is non-increasing.
    monotonic_ok = True
    for i in range(len(data) - 1):
        if data[i]['score'] < data[i+1]['score']:
             print(f"Sort Error: Row {i} score {data[i]['score']} < Row {i+1} score {data[i+1]['score']}")
             monotonic_ok = False
        if data[i]['gpa'] < data[i+1]['gpa']:
             print(f"Monotonicity Violation: Score {data[i]['score']} has grade {data[i]['grade']} ({data[i]['gpa']}), but lower score {data[i+1]['score']} has higher grade {data[i+1]['grade']} ({data[i+1]['gpa']}) -> FAIL")
             monotonic_ok = False
    if monotonic_ok:
        print("Monotonicity (higher score >= higher grade): PASS")

    # 2. Tie consistency
    score_to_grades = collections.defaultdict(set)
    for d in data:
        score_to_grades[d['score']].add(d['grade'])
    
    tie_ok = True
    for s, gs in score_to_grades.items():
        if len(gs) > 1:
            print(f"Tie Violation: Score {s} has multiple grades: {gs} -> FAIL")
            tie_ok = False
    if tie_ok:
        print("Tie Consistency (same score = same grade): PASS")

    # 3. Aggregates (Mean)
    mean_gpa = sum(d['gpa'] for d in data) / n
    mean_ok = 3.28 <= mean_gpa <= 3.32
    print(f"Mean GPA: {mean_gpa:.4f} (Target 3.28-3.32) -> {'PASS' if mean_ok else 'FAIL'}")

    # 4. Tiers Distribution
    # Tier mapping
    tiers = [
        {"labels": ["A+", "A"], "min": 10, "max": 14},
        {"labels": ["A-"], "min": 18, "max": 22},
        {"labels": ["B+"], "min": 30, "max": 36},
        {"labels": ["B"], "min": 18, "max": 22},
        {"labels": ["B-"], "min": 11, "max": 15},
        {"labels": ["C+", "C", "C-", "D", "F"], "min": 1, "max": 4}
    ]
    
    grade_counts = collections.Counter(d['grade'] for d in data)
    dist_ok = True
    for t in tiers:
        count = sum(grade_counts[l] for l in t['labels'])
        p = (count / n) * 100
        ok = t['min'] <= p <= t['max']
        print(f"Tier {t['labels']}: {p:.2f}% (Target {t['min']}-{t['max']}%) -> {'PASS' if ok else 'FAIL'}")
        if not ok: dist_ok = False
        
    return monotonic_ok and tie_ok and mean_ok and dist_ok

scenarios = ['grade_assignment_scenario_1.csv', 'grade_assignment_scenario_2.csv', 'grade_assignment_scenario_3.csv']
for s in scenarios:
    check_csv(s, 'config.json')
