import React from 'react';
import { DistributionResult, GradeEngineConfig } from '../types';
import DistributionChart from './DistributionChart';

interface ResultCardProps {
  result: DistributionResult;
  config: GradeEngineConfig;
  rawScores: number[];
}

const ResultCard: React.FC<ResultCardProps> = ({ result, config, rawScores }) => {
  const { mean, median, distribution } = result.compliance;
  const isCompliant = mean && median && distribution.every(d => d.compliant);
  const totalStudents = rawScores.length;

  const downloadCSV = () => {
    const sortedScores = [...rawScores].sort((a, b) => b - a);
    const assignments = sortedScores.map(score => {
      let assigned = config.grades[config.grades.length - 1];
      for (const grade of config.grades) {
        const cutoff = result.cutoffs[grade.label];
        if (cutoff !== undefined && score >= cutoff) {
          assigned = grade;
          break;
        }
      }
      return {
        score,
        grade: assigned.label,
        points: assigned.value.toFixed(3)
      };
    });

    const csvRows = [
      ['Raw Score', 'Letter Grade', 'GPA Value'],
      ...assignments.map(a => [a.score.toString(), a.grade, a.points])
    ];

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `grade_assignment_${result.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`bg-white rounded-3xl shadow-xl border-2 ${isCompliant ? 'border-emerald-500/20' : 'border-amber-500/20'} overflow-hidden transition-all duration-500 hover:shadow-2xl mb-10`}>
      <div className={`p-8 border-b flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 ${isCompliant ? 'bg-emerald-50/30' : 'bg-amber-50/30'}`}>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="text-[10px] font-black bg-slate-900 text-white px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm">Scenario {result.rank}</span>

            <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm ${mean ? 'bg-emerald-600 text-white' : 'bg-rose-500 text-white'}`}>
              Mean: {result.meanGpa.toFixed(3)} {mean ? '✓' : '✗'}
            </span>

            <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm ${median ? 'bg-emerald-600 text-white' : 'bg-rose-500 text-white'}`}>
              Median: {result.medianGpa.toFixed(3)} {median ? '✓' : '✗'}
            </span>
          </div>

          <div className="flex flex-wrap gap-2 mt-2">
            {distribution.map((dist, idx) => (
              <span key={idx} className={`text-[9px] font-bold px-2 py-1 rounded-lg border ${dist.compliant ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
                {dist.label}: {dist.actual}% {dist.compliant ? '✓' : '✗'}
              </span>
            ))}
          </div>
        </div>

        <button
          onClick={downloadCSV}
          className="w-full lg:w-auto bg-slate-900 hover:bg-black text-white px-10 py-5 rounded-2xl text-lg font-black shadow-2xl shadow-slate-300 transition-all transform active:scale-95 flex items-center justify-center gap-4 group"
        >
          <svg className="w-6 h-6 group-hover:translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          Export CSV
        </button>
      </div>

      <div className="p-8 lg:p-12 grid grid-cols-1 xl:grid-cols-12 gap-12 bg-white">
        <div className="xl:col-span-7">
          <div className="flex items-center justify-between mb-10">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Distribution Heatmap</h4>
          </div>
          <DistributionChart counts={result.gradeCounts} grades={config.grades} total={totalStudents} />
        </div>

        <div className="xl:col-span-5">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Tier Cutoff Matrix</h4>
          <div className="rounded-3xl border border-slate-100 overflow-hidden shadow-sm bg-slate-50/30">
            <table className="w-full text-[14px]">
              <thead className="bg-white text-slate-400 font-bold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-5 text-left">GRADE</th>
                  <th className="px-6 py-5 text-center">CUTOFF</th>
                  <th className="px-6 py-5 text-right">FREQ.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {config.grades.map(grade => {
                  const freq = result.gradeCounts[grade.label] || 0;
                  const isZero = freq === 0;
                  return (
                    <tr key={grade.label} className={`transition-colors ${isZero ? 'opacity-30' : 'hover:bg-white'}`}>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-black text-slate-900">{grade.label}</span>
                          <span className="text-[10px] font-bold text-slate-400">{grade.value.toFixed(3)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-block px-4 py-1.5 rounded-xl font-black ${isZero ? 'bg-slate-100 text-slate-400' : 'bg-blue-600 text-white'}`}>
                          {result.cutoffs[grade.label] !== undefined ? `≥ ${result.cutoffs[grade.label].toFixed(1)}` : '--'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-black text-slate-700">{freq}</span>
                          <span className="text-[10px] font-black text-slate-400 uppercase">{((freq / totalStudents) * 100).toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultCard;
