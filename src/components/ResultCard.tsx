import React from 'react';
import { DistributionResult, GradeEngineConfig } from '../types';

interface ResultCardProps {
  result: DistributionResult;
  config: GradeEngineConfig;
}

export const ResultCard: React.FC<ResultCardProps> = ({ result, config }) => {
  const { mean, median, distribution } = result.compliance;
  const isCompliant = mean && median && distribution.every(d => d.compliant);
  const totalStudents = Object.values(result.gradeCounts).reduce((a: number, b: any) => a + (b as number), 0);

  return (
    <div className={`bg-white rounded-3xl shadow-lg border-2 ${isCompliant ? 'border-emerald-500/10' : 'border-amber-500/10'} overflow-hidden transition-all duration-500 hover:shadow-xl group`}>
      <div className={`p-6 border-b flex items-center justify-between ${isCompliant ? 'bg-emerald-50/20' : 'bg-amber-50/20'}`}>
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[10px] font-black bg-slate-900 text-white px-3 py-1 rounded-full uppercase tracking-widest">Scenario {result.rank}</span>
            <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${mean ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
              Mean GPA: {result.meanGpa.toFixed(3)}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {distribution.map((dist, idx) => (
            <span key={idx} className={`text-[9px] font-bold px-2 py-0.5 rounded-lg border ${dist.compliant ? 'border-emerald-100 bg-white text-emerald-600' : 'border-rose-100 bg-white text-rose-600'}`}>
              {dist.label}: {dist.actual}%
            </span>
          ))}
        </div>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {config.grades.map(grade => {
            const freq = result.gradeCounts[grade.label] || 0;
            const isZero = freq === 0;
            const cutoff = result.cutoffs[grade.label];
            return (
              <div key={grade.label} className={`p-4 rounded-2xl border transition-all ${isZero ? 'opacity-20 bg-slate-50 border-transparent' : 'bg-white border-slate-100 hover:border-indigo-200 hover:shadow-md'}`}>
                <div className="text-xl font-black text-slate-800">{grade.label}</div>
                <div className="text-[10px] font-bold text-slate-400 mb-2">{grade.value.toFixed(3)}</div>
                <div className="bg-slate-100 rounded-lg py-1 text-center mb-2">
                  <span className="text-[10px] font-black text-slate-600">
                    {cutoff !== undefined ? `≥ ${cutoff.toFixed(1)}` : '--'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-indigo-600">{freq}</span>
                  <span className="text-[9px] font-bold text-slate-400">{((freq / totalStudents) * 100).toFixed(1)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
