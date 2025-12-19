
import { calculateDistributions } from './services/gradeEngine';
import config from './config.json';
import * as fs from 'fs';
import { GradeEngineConfig } from './types';

const scores = [
    97, 97, 91, 90, 90, 89, 89, 88, 87, 87, 86, 86, 86, 86, 85, 85, 85, 85, 84, 84, 84,
    83, 83, 83, 82, 82, 82, 82, 81, 81, 81, 81, 80, 80, 80, 80, 79, 79, 79, 78, 78, 78,
    78, 78, 77, 76, 76, 76, 76, 75, 75, 75, 75, 74, 74, 74, 74, 74, 73, 72, 72, 70, 70,
    70, 69, 69, 68, 66, 65, 63, 63, 62, 61, 60, 60, 59, 55, 51, 77
];

const results = calculateDistributions(scores, config as GradeEngineConfig);

results.slice(0, 3).forEach((res, i) => {
    let csv = 'Raw Score,Letter Grade,GPA Value\n';
    const sorted = [...scores].sort((a, b) => b - a);
    sorted.forEach(s => {
        let assigned = config.grades[config.grades.length - 1];
        for (const grade of config.grades) {
            const cutoff = res.cutoffs[grade.label];
            if (cutoff !== undefined && s >= cutoff) {
                assigned = grade;
                break;
            }
        }
        csv += `${s},${assigned.label},${assigned.value.toFixed(3)}\n`;
    });
    const filename = `grade_report_scenario_${i + 1}.csv`;
    fs.writeFileSync(filename, csv);
    console.log(`Generated ${filename}`);
});
