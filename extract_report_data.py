
import csv, collections, json

def get_stats(filename):
    with open(filename, 'r') as f:
        data = list(csv.DictReader(f))
    counts = collections.Counter(d['Letter Grade'] for d in data)
    n = len(data)
    mean = sum(float(d['GPA Value']) for d in data) / n
    tiers = [
        (['A+', 'A'], counts['A+'] + counts['A']),
        (['A-'], counts['A-']),
        (['B+'], counts['B+']),
        (['B'], counts['B']),
        (['B-'], counts['B-']),
        (['C+', 'C', 'C-', 'D', 'F'], counts['C+'] + counts['C'] + counts['C-'] + counts['D'] + counts['F'])
    ]
    
    tier_stats = []
    for labels, c in tiers:
        tier_stats.append({
            "labels": labels,
            "count": c,
            "percent": (c/n)*100
        })
        
    grade_cutoffs = {}
    for grade in counts:
        scores_for_grade = [int(d['Raw Score']) for d in data if d['Letter Grade'] == grade]
        grade_cutoffs[grade] = min(scores_for_grade) if scores_for_grade else None

    return {
        'mean': mean,
        'tier_stats': tier_stats,
        'cutoffs': grade_cutoffs,
        'grade_counts': counts
    }

report_data = {}
for i in range(1, 4):
    fname = f'grade_assignment_scenario_{i}.csv'
    try:
        report_data[fname] = get_stats(fname)
    except FileNotFoundError:
        print(f"Warning: {fname} not found.")

print(json.dumps(report_data, indent=2))
