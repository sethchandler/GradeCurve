import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { GradeEngineConfig, DistributionResult } from '../types';

interface DistributionChartProps {
  results: DistributionResult[];
  config: GradeEngineConfig;
}

const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f97316', '#10b981'];

export const DistributionChart: React.FC<DistributionChartProps> = ({ results, config }) => {
  const data = config.grades.map((grade) => {
    const entry: any = { name: grade.label };
    results.forEach((res, i) => {
      const count = res.gradeCounts[grade.label] || 0;
      const total = Object.values(res.gradeCounts).reduce((a: number, b: any) => a + (b as number), 0);
      entry[`Scenario ${i + 1}`] = parseFloat(((count / total) * 100).toFixed(1));
    });
    return entry;
  });

  return (
    <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-black text-slate-800 tracking-tight">Distribution Comparison</h3>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Multi-Scenario Overlay (%)</p>
        </div>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              unit="%"
            />
            <Tooltip
              cursor={{ fill: '#f8fafc' }}
              contentStyle={{
                borderRadius: '16px',
                border: 'none',
                boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
            />
            {results.map((_, i) => (
              <Bar
                key={i}
                dataKey={`Scenario ${i + 1}`}
                fill={COLORS[i % COLORS.length]}
                radius={[4, 4, 0, 0]}
                barSize={results.length > 3 ? 12 : 20}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
