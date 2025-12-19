import React, { useState } from 'react';
import { SettingsPanel } from './components/SettingsPanel';
import { DistributionChart } from './components/DistributionChart';
import { ResultCard } from './components/ResultCard';
import { FileUploader } from './components/FileUploader';
import { ColumnMapper } from './components/ColumnMapper';
import { GeminiReport } from './components/GeminiReport';
import { calculateDistributions } from './services/gradeEngine';
import { EMORY_LAW_CONFIG } from './constants';
import { GradeEngineConfig, DistributionResult, ScoreRow } from './types';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

const App: React.FC = () => {
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [rawData, setRawData] = useState<ScoreRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [filename, setFilename] = useState<string>('');
  const [scoreColumn, setScoreColumn] = useState<string>('');
  const [preservedColumns, setPreservedColumns] = useState<string[]>([]);
  const [config, setConfig] = useState<GradeEngineConfig>(EMORY_LAW_CONFIG);
  const [geminiApiKey, setGeminiApiKey] = useState<string>('');
  const [results, setResults] = useState<DistributionResult[]>([]);

  const handleDataLoaded = (data: ScoreRow[], cols: string[], name: string) => {
    setRawData(data);
    setColumns(cols);
    setFilename(name);
    setStep(1);
    const scoreCol = cols.find(c => /score|grade|points|raw/i.test(c)) || '';
    setScoreColumn(scoreCol);
    setPreservedColumns(cols.filter(c => c !== scoreCol));
  };

  const handleRawScores = (name: string, scores: number[]) => {
    const data = scores.map(s => ({ "Raw Score": s, __raw_score__: s }));
    handleDataLoaded(data, ["Raw Score"], name);
    setScoreColumn("Raw Score");
  };

  const handleGenerate = () => {
    const rawScores = rawData.map(d => {
      const val = Number(d[scoreColumn]);
      return isNaN(val) ? 0 : val;
    });
    const calculated = calculateDistributions(rawScores, config);
    setResults(calculated);
    setStep(2);
  };

  const exportResults = (format: 'csv' | 'xlsx') => {
    const exportData = rawData.map(row => {
      const newRow: any = {};
      preservedColumns.forEach(col => { newRow[col] = row[col]; });
      newRow[scoreColumn] = row[scoreColumn];
      results.forEach((res, i) => {
        const score = Number(row[scoreColumn]);
        newRow[`Scenario ${i + 1} Grade`] = res.scoreMap[score] || 'F';
      });
      return newRow;
    });

    if (format === 'csv') {
      const csv = Papa.unparse(exportData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Grades_${filename || 'results'}.csv`;
      link.click();
    } else {
      const wb = XLSX.utils.book_new();

      // Sheet 1: Student Grades
      const wsGrades = XLSX.utils.json_to_sheet(exportData);
      XLSX.utils.book_append_sheet(wb, wsGrades, "Student Grades");

      // Sheet 2: Compliance Summary
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

      XLSX.writeFile(wb, `GradeCurve_Report_${filename || 'results'}.xlsx`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 backdrop-blur-md bg-white/80">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              <span className="font-black text-xl">G</span>
            </div>
            <h1 className="text-xl font-black tracking-tight text-slate-800">GradeCurve <span className="text-indigo-600">Pro</span></h1>
          </div>
          <div className="flex items-center gap-6">
            {step > 0 && (
              <button onClick={() => setStep(0)} className="text-sm font-bold text-slate-500 hover:text-indigo-600">START OVER</button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-12">
        {step === 0 && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Rigorous Grading for Higher Ed</h2>
              <p className="text-lg text-slate-500">Upload your class roster to generate mathematically sound, monotonic grade distributions.</p>
            </div>
            <FileUploader onDataLoaded={handleDataLoaded} onRawScoresInput={handleRawScores} />
          </div>
        )}

        {step === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <ColumnMapper
                columns={columns}
                scoreColumn={scoreColumn}
                preservedColumns={preservedColumns}
                onSetScoreColumn={setScoreColumn}
                onTogglePreserved={(col) => setPreservedColumns(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col])}
                onProceed={handleGenerate}
              />
            </div>
            <div className="lg:col-span-1">
              <SettingsPanel config={config} onUpdate={setConfig} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-12 animate-in fade-in duration-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-black text-slate-900">Distribution Results</h2>
                <p className="text-slate-500">Analyzing {results.length} valid scenarios based on {rawData.length} records.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => exportResults('csv')} className="px-6 py-3 bg-white border border-slate-200 rounded-xl font-bold hover:text-indigo-600 flex items-center gap-2">DOWNLOAD CSV</button>
                <button onClick={() => exportResults('xlsx')} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg flex items-center gap-2">DOWNLOAD EXCEL</button>
              </div>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <div className="space-y-6">
                {results.map((res) => (
                  <ResultCard key={res.id} result={res} config={config} />
                ))}
              </div>
              <div className="space-y-8">
                <DistributionChart results={results} config={config} />
                <GeminiReport results={results} apiKey={geminiApiKey} onApiKeyChange={setGeminiApiKey} />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
