import React from 'react';
import { GradeEngineConfig, GradeDefinition } from '../types';

interface SettingsPanelProps {
  config: GradeEngineConfig;
  onUpdate: (config: GradeEngineConfig) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ config, onUpdate }) => {
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
    onUpdate({ ...config, grades: newGrades });
  };

  const handleJsonChange = (val: string) => {
    setJsonConfig(val);
    try {
      const parsed = JSON.parse(val);
      onUpdate({
        ...config,
        aggregate: parsed.aggregate || {},
        distribution: parsed.distribution || [],
        targetResultCount: parsed.targetResultCount || 3
      });
    } catch (e) {
      // Invalid JSON
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:sticky lg:top-24 max-h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center justify-between">
          Grade Scale
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded">Scale</span>
        </h2>
        <div className="space-y-1.5">
          <div className="grid grid-cols-12 gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest pb-2 border-b border-slate-100">
            <div className="col-span-4">Label</div>
            <div className="col-span-8 text-center text-indigo-600">GPA Value</div>
          </div>
          {config.grades.map((grade, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-center group/row">
              <div className="col-span-3 font-bold text-slate-600">
                {grade.label}
              </div>
              <div className="col-span-7">
                <input
                  type="number"
                  step="0.001"
                  value={grade.value}
                  onChange={(e) => handleGradeChange(idx, 'value', e.target.value)}
                  className="w-full p-2 text-sm border border-slate-100 bg-slate-50 rounded-lg text-center outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono"
                />
              </div>
              <div className="col-span-2 flex justify-end">
                <button
                  onClick={() => {
                    const newGrades = config.grades.filter((_, i) => i !== idx);
                    onUpdate({ ...config, grades: newGrades });
                  }}
                  className="opacity-0 group-hover/row:opacity-100 p-2 text-rose-400 hover:text-rose-600 transition-all"
                  title="Remove Grade"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">Constraints</h2>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded">JSON</span>
        </div>
        <textarea
          value={jsonConfig}
          onChange={(e) => handleJsonChange(e.target.value)}
          rows={10}
          className="w-full font-mono text-[10px] p-4 bg-slate-900 text-indigo-300 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500/50 outline-none resize-none"
          spellCheck={false}
        />
      </div>
    </div>
  );
};
