import React from 'react';
import { GradeEngineConfig, GradeDefinition } from '../types';

interface SettingsPanelProps {
  config: GradeEngineConfig;
  onChange: (config: GradeEngineConfig) => void;
  onApply: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ config, onChange, onApply }) => {
  const [jsonConfig, setJsonConfig] = React.useState(JSON.stringify({
    aggregate: config.aggregate,
    distribution: config.distribution,
    targetResultCount: config.targetResultCount
  }, null, 2));

  const handleGradeChange = (index: number, field: keyof GradeDefinition, value: string) => {
    const newGrades = [...config.grades];
    if (field === 'label') {
      newGrades[index].label = value;
    } else {
      const numValue = parseFloat(value);
      newGrades[index].value = isNaN(numValue) ? 0 : numValue;
    }
    onChange({ ...config, grades: newGrades });
  };

  const handleJsonChange = (val: string) => {
    setJsonConfig(val);
    try {
      const parsed = JSON.parse(val);
      onChange({
        ...config,
        aggregate: parsed.aggregate || {},
        distribution: parsed.distribution || [],
        targetResultCount: parsed.targetResultCount || 3
      });
    } catch (e) {
      // Invalid JSON, don't update parent yet
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-8">
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-4">Grade Scale</h2>
        <div className="space-y-2">
          <div className="grid grid-cols-12 gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest pb-2 border-b border-slate-100">
            <div className="col-span-8">Label</div>
            <div className="col-span-4 text-center">GPA Value</div>
          </div>
          {config.grades.map((grade, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-8">
                <input
                  type="text"
                  value={grade.label}
                  onChange={(e) => handleGradeChange(idx, 'label', e.target.value)}
                  className="w-full p-2 text-sm border border-slate-100 bg-slate-50 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                />
              </div>
              <div className="col-span-4">
                <input
                  type="number"
                  step="0.001"
                  value={grade.value}
                  onChange={(e) => handleGradeChange(idx, 'value', e.target.value)}
                  className="w-full p-2 text-sm border border-slate-100 bg-slate-50 rounded-lg text-center outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all font-mono"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">Constraints (JSON)</h2>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded">Advanced</span>
        </div>
        <textarea
          value={jsonConfig}
          onChange={(e) => handleJsonChange(e.target.value)}
          rows={12}
          className="w-full font-mono text-xs p-4 bg-slate-900 text-blue-300 rounded-2xl border-none focus:ring-2 focus:ring-blue-500/50 outline-none resize-none shadow-inner"
          spellCheck={false}
        />
        <p className="mt-2 text-[10px] text-slate-400 italic">
          Specify mean, median ranges and distributional groups here.
        </p>
      </div>

      <button
        onClick={onApply}
        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
        Generate Distributions
      </button>
    </div>
  );
};

export default SettingsPanel;
