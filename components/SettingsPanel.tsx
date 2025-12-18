
import React from 'react';
import { GradeCategory, GradeEngineConfig } from '../types';

interface SettingsPanelProps {
  config: GradeEngineConfig;
  onChange: (config: GradeEngineConfig) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ config, onChange }) => {
  const handleCategoryChange = (index: number, field: keyof GradeCategory, value: string) => {
    const newCategories = [...config.categories];
    const numValue = parseFloat(value);
    
    if (field === 'label') {
      newCategories[index].label = value;
    } else {
      newCategories[index][field] = isNaN(numValue) ? 0 : numValue;
    }

    onChange({ ...config, categories: newCategories });
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-slate-800">Target Requirements</h2>
        <div className="flex gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Target Mean</label>
            <input
              type="number"
              step="0.01"
              value={config.targetMean}
              onChange={(e) => onChange({ ...config, targetMean: parseFloat(e.target.value) || 0 })}
              className="w-20 p-1 text-sm border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Tolerance</label>
            <input
              type="number"
              step="0.001"
              value={config.meanTolerance}
              onChange={(e) => onChange({ ...config, meanTolerance: parseFloat(e.target.value) || 0 })}
              className="w-20 p-1 text-sm border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-12 gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100">
          <div className="col-span-5">Grade Label</div>
          <div className="col-span-3 text-center">GPA Val</div>
          <div className="col-span-4 text-center">Target %</div>
        </div>
        {config.categories.map((cat, idx) => (
          <div key={idx} className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-5">
              <input
                type="text"
                value={cat.label}
                onChange={(e) => handleCategoryChange(idx, 'label', e.target.value)}
                className="w-full p-1.5 text-sm border border-slate-100 bg-slate-50 rounded focus:bg-white outline-none transition-colors"
              />
            </div>
            <div className="col-span-3">
              <input
                type="number"
                step="0.1"
                value={cat.gpaValue}
                onChange={(e) => handleCategoryChange(idx, 'gpaValue', e.target.value)}
                className="w-full p-1.5 text-sm border border-slate-100 bg-slate-50 rounded text-center outline-none"
              />
            </div>
            <div className="col-span-4">
              <input
                type="number"
                step="0.1"
                value={cat.targetPercent}
                onChange={(e) => handleCategoryChange(idx, 'targetPercent', e.target.value)}
                className="w-full p-1.5 text-sm border border-slate-100 bg-slate-50 rounded text-center outline-none"
              />
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
        <span className="text-xs text-slate-500">
          Total Distribution: {config.categories.reduce((acc, c) => acc + c.targetPercent, 0).toFixed(1)}%
        </span>
        {Math.abs(config.categories.reduce((acc, c) => acc + c.targetPercent, 0) - 100) > 0.01 && (
          <span className="text-xs text-amber-600 font-medium">Must total 100%</span>
        )}
      </div>
    </div>
  );
};

export default SettingsPanel;
