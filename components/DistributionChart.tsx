import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { GradeDefinition } from '../types';

interface DistributionChartProps {
  counts: Record<string, number>;
  grades: GradeDefinition[];
  total: number;
}

// 12 Distinct colors for the full grade scale
const COLORS = [
  '#1e3a8a', // A+ (Deep Blue)
  '#2563eb', // A
  '#60a5fa', // A-
  '#0d9488', // B+ (Teal)
  '#10b981', // B
  '#34d399', // B-
  '#eab308', // C+ (Gold)
  '#f59e0b', // C
  '#f97316', // C-
  '#dc2626', // D+ (Red)
  '#991b1b', // D
  '#18181b', // F (Neutral/Dark)
];

const DistributionChart: React.FC<DistributionChartProps> = ({ counts, grades, total }) => {
  const data = grades.map((grade) => ({
    name: grade.label,
    actual: parseFloat(((counts[grade.label] || 0) / total * 100).toFixed(1)),
    count: counts[grade.label] || 0
  }));

  return (
    <div className="h-72 w-full">
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
          <Bar dataKey="actual" radius={[6, 6, 0, 0]} barSize={28}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DistributionChart;
