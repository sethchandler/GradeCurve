
import React from 'react';
import { DistributionResult, GradeCategory } from '../types';
import DistributionChart from './DistributionChart';

interface ResultCardProps {
  result: DistributionResult;
  categories: GradeCategory[];
  rawScores: number[];
  targetMean: number;
}

const ResultCard: React.FC<ResultCardProps> = ({ result, categories, rawScores, targetMean }) => {
  const isStrictlyConforming = result.meanGpa >= 3.28 && result.meanGpa <= 3.32;
  const totalStudents = rawScores.length;

  const downloadCSV = () => {
    // Generate full student-by-student assignment
    const sortedScores = [...rawScores].sort((a, b) => b - a);

    const assignments = sortedScores.map(score => {
      let assigned = categories[categories.length - 1]; // Default to lowest grade (F)
      for (const cat of categories) {
        const cutoff = result.cutoffs[cat.label];
        if (cutoff !== undefined && score >= cutoff) {
          assigned = cat;
          break;
        }
      }
      return {
        score,
        grade: assigned.label,
        points: assigned.gpaValue.toFixed(3)
      };
    });

    // CSV Construction: Score, Grade, Points
    const csvRows = [
      ['Raw Score', 'Letter Grade', 'GPA Value'],
      ...assignments.map(a => [a.score.toString(), a.grade, a.points])
    ];

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `grade_assignment_mean_${result.meanGpa.toFixed(3)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`bg-white rounded-3xl shadow-xl border-2 ${isStrictlyConforming ? 'border-blue-500/20' : 'border-slate-200'} overflow-hidden transition-all duration-500 hover:shadow-2xl mb-10`}>
      <div className={`p-8 border-b flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 ${isStrictlyConforming ? 'bg-gradient-to-r from-blue-50/50 to-indigo-50/50' : 'bg-slate-50'}`}>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4">
             <span className="text-[10px] font-black bg-slate-900 text-white px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm">Scenario {result.rank}</span>
             {isStrictlyConforming ? (
               <span className="text-[10px] font-black bg-blue-600 text-white px-3 py-1.5 rounded-full uppercase tracking-widest flex items-center gap-1.5 shadow-sm shadow-blue-200">
                 <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                 Mean Verified [3.28-3.32]
               </span>
             ) : (
               <span className="text-[10px] font-black bg-amber-500 text-white px-3 py-1.5 rounded-full uppercase tracking-widest">Target Deviation</span>
             )}
          </div>
          <div className="flex items-baseline gap-4">
            <h3 className="text-6xl font-black text-slate-900 tracking-tighter">
              {result.meanGpa.toFixed(3)}
            </h3>
            <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Target Mean Met</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
             <div className="text-[11px] font-black text-slate-500 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm">
                Distribution Error: <span className={result.distributionError < 10 ? 'text-emerald-600' : 'text-blue-600'}>{result.distributionError}%</span>
             </div>
             <div className="text-[11px] font-black text-slate-500 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm">
                {totalStudents} Student Records
             </div>
          </div>
        </div>
        
        <button 
          onClick={downloadCSV}
          className="w-full lg:w-auto bg-slate-900 hover:bg-black text-white px-10 py-5 rounded-2xl text-lg font-black shadow-2xl shadow-slate-300 transition-all transform active:scale-95 flex items-center justify-center gap-4 group"
        >
          <svg className="w-6 h-6 group-hover:translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          Use this distribution
        </button>
      </div>

      <div className="p-8 lg:p-12 grid grid-cols-1 xl:grid-cols-12 gap-12 bg-white">
        <div className="xl:col-span-7">
          <div className="flex items-center justify-between mb-10">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Distribution Heatmap</h4>
          </div>
          <DistributionChart counts={result.gradeCounts} categories={categories} total={totalStudents} />
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
                {categories.map(cat => {
                  const freq = result.gradeCounts[cat.label] || 0;
                  const isZero = freq === 0;
                  return (
                    <tr key={cat.label} className={`transition-colors ${isZero ? 'opacity-30' : 'hover:bg-white'}`}>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-black text-slate-900">{cat.label}</span>
                          <span className="text-[10px] font-bold text-slate-400">{cat.gpaValue.toFixed(3)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                         <span className={`inline-block px-4 py-1.5 rounded-xl font-black ${isZero ? 'bg-slate-100 text-slate-400' : 'bg-blue-600 text-white'}`}>
                            {result.cutoffs[cat.label] !== undefined ? `≥ ${result.cutoffs[cat.label].toFixed(1)}` : '--'}
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
