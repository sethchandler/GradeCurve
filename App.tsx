
import React, { useState, useCallback } from 'react';
import ScoreInput from './components/ScoreInput';
import SettingsPanel from './components/SettingsPanel';
import ResultCard from './components/ResultCard';
import {
  GradeEngineConfig,
  DistributionResult
} from './types';
import defaultConfig from './config.json';
import { calculateDistributions } from './services/gradeEngine';

const App: React.FC = () => {
  const [scores, setScores] = useState<number[]>([
    97, 97, 91, 90, 90, 89, 89, 88, 87, 87, 86, 86, 86, 86, 85, 85, 85, 85, 84, 84, 84,
    83, 83, 83, 82, 82, 82, 82, 81, 81, 81, 81, 80, 80, 80, 80, 79, 79, 79, 78, 78, 78,
    78, 78, 77, 76, 76, 76, 76, 75, 75, 75, 75, 74, 74, 74, 74, 74, 73, 72, 72, 70, 70,
    70, 69, 69, 68, 66, 65, 63, 63, 62, 61, 60, 60, 59, 55, 51, 77
  ]);
  const [config, setConfig] = useState<GradeEngineConfig>(defaultConfig as GradeEngineConfig);
  const [results, setResults] = useState<DistributionResult[]>([]);
  const [isCalculated, setIsCalculated] = useState(false);
  const [isComputing, setIsComputing] = useState(false);

  const runCalculation = useCallback((activeScores: number[], currentConfig: GradeEngineConfig) => {
    if (activeScores.length === 0) return;
    setIsComputing(true);

    // Defer to prevent blocking the UI thread
    setTimeout(() => {
      try {
        const newResults = calculateDistributions(activeScores, currentConfig);
        setResults(newResults);
        setIsCalculated(true);
      } catch (err) {
        console.error("Calculation failed", err);
      } finally {
        setIsComputing(false);
      }
    }, 10);
  }, []);

  const handleGenerate = (loadedScores?: number[]) => {
    const activeScores = loadedScores || scores;
    if (activeScores.length === 0) return;
    setScores(activeScores);
    runCalculation(activeScores, config);
  };

  const handleConfigChange = (newConfig: GradeEngineConfig) => {
    setConfig(newConfig);
  };

  const handleApplyConfig = () => {
    if (scores.length > 0) {
      runCalculation(scores, config);
    }
  };

  const hasData = scores.length > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tight">GradeCurve Pro</h1>
          <p className="mt-2 text-lg text-slate-500 max-w-2xl font-medium">
            Generalized grading engine supporting arbitrary aggregate and distributional constraints.
          </p>
        </div>
        <div className="shrink-0">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest bg-slate-100 px-4 py-2 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Live Assignment Engine
          </div>
        </div>
      </header>

      <main className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        <aside className="xl:col-span-4 space-y-8">
          <ScoreInput onScoresLoaded={handleGenerate} />
          <SettingsPanel config={config} onChange={handleConfigChange} onApply={handleApplyConfig} />

          {hasData && (
            <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl">
              <div className="flex items-center gap-4">
                <div className="text-3xl font-black text-blue-400">{scores.length}</div>
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Students Loaded</div>
                  <div className="text-xs text-slate-300">Mean Score: {(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)}</div>
                </div>
              </div>
            </div>
          )}
        </aside>

        <section className="xl:col-span-8 space-y-8">
          {isComputing ? (
            <div className="h-96 flex flex-col items-center justify-center bg-white border border-slate-100 rounded-3xl shadow-sm">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
              </div>
              <h3 className="mt-6 text-xl font-bold text-slate-800">Assigning Grades...</h3>
              <p className="text-slate-400 text-sm mt-1">Exploring possible distributions</p>
            </div>
          ) : !isCalculated ? (
            <div className="h-96 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 p-10 text-center">
              <div className="w-16 h-16 bg-white border border-slate-200 text-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-slate-800">Ready for Distribution</h3>
              <p className="text-slate-500 mt-2 max-w-sm">
                Enter student scores and define your constraints to generate compliant distributions.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-2xl font-bold text-slate-900">Compliant Distributions</h2>
                <div className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-lg uppercase tracking-wider">
                  {results.length} Found
                </div>
              </div>

              {results.length === 0 ? (
                <div className="bg-amber-50 border border-amber-200 p-10 rounded-3xl text-center">
                  <div className="w-12 h-12 bg-amber-200 text-amber-700 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl">!</div>
                  <h3 className="text-amber-900 font-bold text-lg">No Distributions Found</h3>
                  <p className="text-amber-700 text-sm mt-2 max-w-md mx-auto">
                    We couldn't find an assignment that satisfies all your constraints.
                    Try <strong>loosening the ranges</strong> or checking your score data.
                  </p>
                </div>
              ) : (
                results.map((res) => (
                  <ResultCard
                    key={res.id}
                    result={res}
                    config={config}
                    rawScores={scores}
                  />
                ))
              )}
            </div>
          )
          }
        </section>
      </main>

      <footer className="mt-20 py-10 border-t border-slate-200 text-center text-slate-400 text-xs font-medium uppercase tracking-widest">
        GradeCurve Pro — Academic Compliance Utility
      </footer>
    </div>
  );
};

export default App;
