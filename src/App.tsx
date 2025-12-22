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
import { validateConfig } from './utils/validation';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { saveFile } from './utils/fileExport';

declare const __BUILD_TIMESTAMP__: string;
declare const __APP_VERSION__: string;

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
    const validation = validateConfig(config);
    if (!validation.valid) {
      alert('Configuration errors:\n\n' + validation.errors.join('\n'));
      return;
    }

    const rawScores = rawData.map(d => {
      const val = Number(d[scoreColumn]);
      return isNaN(val) ? 0 : val;
    });
    const calculated = calculateDistributions(rawScores, config);
    setResults(calculated);
    setStep(2);
  };

  const exportResults = async (format: 'csv' | 'xlsx') => {
    // 1. Prepare data (Synchronous and fast)
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

    const baseFilename = (filename || 'results').replace(/\.[^/.]+$/, "").replace(/[^a-z0-9-_]/gi, '_');

    // 2. Trigger SAVE AS Dialog immediately to preserve user gesture
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
              <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Convert raw scores to grades based on constraints</h2>
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
            
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <div className="xl:col-span-2 space-y-8">
                <div className="space-y-6">
                  {results.map((res) => (
                    <ResultCard key={res.id} result={res} config={config} />
                  ))}
                </div>
                <DistributionChart results={results} config={config} />
                <GeminiReport results={results} apiKey={geminiApiKey} onApiKeyChange={(val) => setGeminiApiKey(val)} />
              </div>
              <div className="xl:col-span-1">
                <div className="mb-4">
                  <button
                    onClick={handleGenerate}
                    className="w-full px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 shadow-lg flex items-center justify-center gap-2 transition-all"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                    REGENERATE WITH NEW CONFIG
                  </button>
                </div>
                <SettingsPanel config={config} onUpdate={setConfig} />
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="max-w-7xl mx-auto px-6 py-8 border-t border-slate-200 mt-20 text-center">
        <p className="text-xs text-slate-400 font-mono lowercase tracking-tighter">
          Build: {__BUILD_TIMESTAMP__} | Version: {__APP_VERSION__}
        </p>
      </footer>
    </div>
  );
};

export default App;
