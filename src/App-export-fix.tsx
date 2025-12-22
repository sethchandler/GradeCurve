// COMPLETE REWRITE OF EXPORT - SIMPLE INTERVAL MAPPING
// This function replaces the broken exportResults function

const exportResultsFixed = async (format: 'csv' | 'xlsx') => {
  // For each scenario, rebuild the ACTUAL cutoffs from the grade distribution
  const scenarioGradeMaps = results.map(res => {
    // Get all grades that have students assigned (count > 0)
    const gradesWithStudents = config.grades.filter(g => (res.gradeCounts[g.label] || 0) > 0);

    // Build boundaries array - we need score thresholds
    // Start from LOWEST grade with students and work up
    const boundaries: number[] = [];
    const gradeLabels: string[] = [];

    // Add boundaries in ASCENDING score order
    for (let i = gradesWithStudents.length - 1; i >= 0; i--) {
      const grade = gradesWithStudents[i];
      const cutoff = res.cutoffs[grade.label];

      if (cutoff !== undefined) {
        // Only add if different from last boundary
        if (boundaries.length === 0 || boundaries[boundaries.length - 1] !== cutoff) {
          boundaries.push(cutoff);
          gradeLabels.push(grade.label);
        }
      }
    }

    // Add upper boundary (infinity)
    boundaries.push(Infinity);

    console.log(`Scenario ${res.rank} boundaries:`, boundaries, 'grades:', gradeLabels);

    // Create mapping function for this scenario
    return (score: number) => {
      // Find which interval the score falls into
      for (let i = 0; i < boundaries.length - 1; i++) {
        if (score >= boundaries[i] && score < boundaries[i + 1]) {
          return gradeLabels[i];
        }
      }
      // If no match (shouldn't happen), return lowest grade
      return config.grades[config.grades.length - 1].label;
    };
  });

  // Now map all student scores using these functions
  const exportData = rawData.map(row => {
    const newRow: any = {};
    preservedColumns.forEach(col => { newRow[col] = row[col]; });
    newRow[scoreColumn] = row[scoreColumn];

    const score = Number(row[scoreColumn]);

    // Apply each scenario's grading function
    scenarioGradeMaps.forEach((gradeFunc, i) => {
      newRow[`Scenario ${i + 1} Grade`] = gradeFunc(score);
    });

    return newRow;
  });

  // Rest of export logic stays the same...
  const baseFilename = (filename || 'results').replace(/\.[^/.]+$/, "").replace(/[^a-z0-9-_]/gi, '_');

  if (format === 'csv') {
    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    await saveFile(blob, `GradeCurve_Grades_${baseFilename}.csv`);
  } else {
    const wb = XLSX.utils.book_new();
    const wsGrades = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, wsGrades, "Student Grades");

    const summaryData = results.map(res => ({
      Scenario: `Scenario ${res.rank}`,
      MeanGPA: res.meanGpa,
      Status: res.compliance.mean ? "Compliant" : "Non-Compliant",
      ...res.compliance.distribution.reduce((acc, d) => ({
        ...acc,
        [`${d.label} (%)`]: d.actual
      }), {})
    }));
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Compliance Summary");

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    await saveFile(blob, `GradeCurve_Report_${baseFilename}.xlsx`);
  }
};