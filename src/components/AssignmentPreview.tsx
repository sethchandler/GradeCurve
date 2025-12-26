import React, { useState } from 'react';
import { DistributionResult, ScoreRow } from '../types';

interface AssignmentPreviewProps {
  rawData: ScoreRow[];
  results: DistributionResult[];
  scoreColumn: string;
  preservedColumns: string[];
}

export const AssignmentPreview: React.FC<AssignmentPreviewProps> = ({
  rawData,
  results,
  scoreColumn,
  preservedColumns
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState(0);

  if (!results.length) return null;

  // Build the exact same data that goes to Excel
  const previewData = rawData.map((row, idx) => {
    const score = Number(row[scoreColumn]);
    const res = results[selectedScenario];

    // Use the getGradeForScore function if available, otherwise fall back to scoreMap
    const grade = res.getGradeForScore
      ? res.getGradeForScore(score)
      : res.scoreMap[score];

    return {
      rowIndex: idx + 1,
      score: score,
      assignedGrade: grade || 'UNMAPPED',
      isError: !grade,
      preservedData: preservedColumns.reduce((acc, col) => {
        acc[col] = row[col];
        return acc;
      }, {} as Record<string, any>)
    };
  });

  // Count errors
  const errorCount = previewData.filter(d => d.isError).length;
  const uniqueScores = [...new Set(previewData.map(d => d.score))].sort((a, b) => b - a);

  // Debug info: show score distribution
  const scoreDistribution = uniqueScores.map(score => {
    const rows = previewData.filter(d => d.score === score);
    const grade = rows[0]?.assignedGrade;
    return { score, count: rows.length, grade };
  });

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        Assignment Preview
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b flex items-center justify-between bg-slate-50">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Grade Assignment Preview</h2>
                <p className="text-sm text-slate-600 mt-1">
                  This shows exactly what will be exported to Excel
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scenario Selector */}
            <div className="p-4 border-b bg-slate-50 flex items-center gap-4">
              <span className="font-bold text-slate-700">Scenario:</span>
              <div className="flex gap-2">
                {results.map((res, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedScenario(idx)}
                    className={`px-4 py-2 rounded-lg font-bold transition-colors ${
                      selectedScenario === idx
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
              {errorCount > 0 && (
                <div className="ml-auto px-4 py-2 bg-red-100 text-red-700 rounded-lg font-bold">
                  ⚠️ {errorCount} UNMAPPED SCORES
                </div>
              )}
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden flex">
              {/* Left: Score Distribution */}
              <div className="w-1/3 border-r overflow-y-auto p-4 bg-slate-50">
                <h3 className="font-bold text-slate-700 mb-3">Score Distribution</h3>
                <div className="space-y-1">
                  {scoreDistribution.map(({ score, count, grade }) => (
                    <div
                      key={score}
                      className={`flex items-center justify-between p-2 rounded text-sm ${
                        !grade ? 'bg-red-100 text-red-700' : 'bg-white'
                      }`}
                    >
                      <span className="font-mono">{score}</span>
                      <span className="text-slate-500">({count})</span>
                      <span className={`font-bold ${!grade ? 'text-red-700' : ''}`}>
                        {grade || 'UNMAPPED'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Individual Assignments */}
              <div className="flex-1 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-slate-100 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-bold text-slate-600">Row</th>
                      <th className="px-4 py-2 text-left text-xs font-bold text-slate-600">Score</th>
                      <th className="px-4 py-2 text-left text-xs font-bold text-slate-600">Grade</th>
                      {preservedColumns.slice(0, 3).map(col => (
                        <th key={col} className="px-4 py-2 text-left text-xs font-bold text-slate-600">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, idx) => (
                      <tr
                        key={idx}
                        className={`border-b ${
                          row.isError
                            ? 'bg-red-50 hover:bg-red-100'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="px-4 py-2 text-sm text-slate-600">{row.rowIndex}</td>
                        <td className="px-4 py-2 text-sm font-mono">{row.score}</td>
                        <td className={`px-4 py-2 text-sm font-bold ${
                          row.isError ? 'text-red-700' : 'text-slate-800'
                        }`}>
                          {row.assignedGrade}
                        </td>
                        {preservedColumns.slice(0, 3).map(col => (
                          <td key={col} className="px-4 py-2 text-sm text-slate-600">
                            {row.preservedData[col]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Debug Info */}
            <div className="p-4 border-t bg-yellow-50">
              <details>
                <summary className="cursor-pointer font-bold text-slate-700">Debug Info</summary>
                <div className="mt-2 space-y-2 text-xs font-mono">
                  <div>Total Rows: {rawData.length}</div>
                  <div>Unique Scores: {uniqueScores.length}</div>
                  <div>ScoreMap Entries: {Object.keys(results[selectedScenario].scoreMap).length}</div>
                  <div className="text-red-600">
                    {errorCount > 0 && `ERROR: ${errorCount} scores have no grade mapping!`}
                  </div>
                  <div className="mt-2">
                    <strong>First 10 scoreMap entries:</strong>
                    <pre className="bg-white p-2 rounded mt-1 overflow-x-auto">
                      {JSON.stringify(
                        Object.entries(results[selectedScenario].scoreMap).slice(0, 10),
                        null,
                        2
                      )}
                    </pre>
                  </div>
                </div>
              </details>
            </div>
          </div>
        </div>
      )}
    </>
  );
};