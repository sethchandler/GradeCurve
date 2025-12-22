import React, { useRef } from 'react';
import { GradeEngineConfig, GradeDefinition, DistributionConstraint } from '../types';

interface SettingsPanelProps {
  config: GradeEngineConfig;
  onUpdate: (config: GradeEngineConfig) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ config, onUpdate }) => {
  const [showJson, setShowJson] = React.useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [jsonConfig, setJsonConfig] = React.useState(JSON.stringify(config, null, 2));

  // Sync JSON state when config updates externally
  React.useEffect(() => {
    setJsonConfig(JSON.stringify(config, null, 2));
  }, [config]);

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

  const handleTierChange = (index: number, field: 'min' | 'max', value: string) => {
    const newDist = [...config.distribution];
    const numValue = parseFloat(value);
    const val = isNaN(numValue) ? undefined : numValue;

    newDist[index] = {
      ...newDist[index],
      percentRange: {
        ...newDist[index].percentRange,
        [field]: val
      }
    };
    onUpdate({ ...config, distribution: newDist });
  };

  const handleMeanChange = (field: 'min' | 'max', value: string) => {
    const numValue = parseFloat(value);
    const val = isNaN(numValue) ? undefined : numValue;
    onUpdate({
      ...config,
      aggregate: {
        ...config.aggregate,
        mean: {
          ...config.aggregate.mean,
          [field]: val
        }
      }
    });
  };

  const handleJsonChange = (val: string) => {
    setJsonConfig(val);
    try {
      const parsed = JSON.parse(val);
      onUpdate(parsed);
    } catch (e) {
      // Invalid JSON - don't update parent yet
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        onUpdate(parsed);
      } catch (error) {
        alert("Invalid JSON configuration file.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200 lg:sticky lg:top-24 max-h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar flex flex-col gap-8">
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Configuration</h2>
          <div className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={() => {
                const blob = new Blob([jsonConfig], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'GradeCurve_Config.json';
                a.click();
              }}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold tracking-widest uppercase transition-colors"
            >
              Download
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold tracking-widest uppercase transition-colors"
            >
              Upload JSON
            </button>
            <button
              onClick={() => setShowJson(!showJson)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-widest uppercase transition-all ${showJson ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {showJson ? 'Visual Editor' : 'Edit Raw JSON'}
            </button>
          </div>
        </div>

        {showJson ? (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed group">
              <strong>Tip:</strong> You can edit the full configuration here. Ensure the JSON follows the schema (Aggregate, Distribution Tiers, and Grade Values).
              <span className="block mt-2 font-mono text-[10px] bg-slate-200/30 p-2 rounded border border-slate-200/50 hidden group-hover:block transition-all animate-in slide-in-from-top-1">
                {`{
  "aggregate": { "mean": { "min": 3.2, "max": 3.4 } },
  "distribution": [{ "labels": ["A"], "percentRange": { "min": 10, "max": 20 } }],
  "grades": [{ "label": "A", "value": 4.0 }]
}`}
              </span>
            </p>
            <textarea
              value={jsonConfig}
              onChange={(e) => handleJsonChange(e.target.value)}
              rows={24}
              className="w-full font-mono text-xs p-6 bg-slate-900 text-indigo-300 rounded-2xl border-none focus:ring-4 focus:ring-indigo-500/20 outline-none resize-none shadow-inner"
              spellCheck={false}
            />
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-200">
            {/* Grade Scale Section */}
            <section>
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                Grade Scale
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {config.grades.map((grade, idx) => (
                  <div key={idx} className="flex items-center gap-3 group">
                    <div className="w-8 font-black text-slate-400 text-xs">{grade.label}</div>
                    <input
                      type="number"
                      step="0.001"
                      value={grade.value}
                      onChange={(e) => handleGradeChange(idx, 'value', e.target.value)}
                      className="flex-1 p-2 text-sm bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono transition-all"
                    />
                    <button
                      onClick={() => onUpdate({ ...config, grades: config.grades.filter((_, i) => i !== idx) })}
                      className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* Mean Constraint Section */}
            <section className="p-5 bg-indigo-50 rounded-2xl border border-indigo-100">
              <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-4">Required Mean GPA</h3>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-[10px] font-black text-indigo-300 uppercase mb-1">Min</label>
                  <input
                    type="number"
                    step="0.01"
                    value={config.aggregate.mean?.min}
                    onChange={(e) => handleMeanChange('min', e.target.value)}
                    className="w-full p-2 text-sm bg-white border border-indigo-100 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
                <div className="text-indigo-200 font-black mt-4">to</div>
                <div className="flex-1">
                  <label className="block text-[10px] font-black text-indigo-300 uppercase mb-1">Max</label>
                  <input
                    type="number"
                    step="0.01"
                    value={config.aggregate.mean?.max}
                    onChange={(e) => handleMeanChange('max', e.target.value)}
                    className="w-full p-2 text-sm bg-white border border-indigo-100 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>
            </section>

            {/* Distribution Tiers Section */}
            <section>
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                Distribution Tiers (%)
              </h3>
              <div className="space-y-4">
                {config.distribution.map((tier, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-indigo-200 transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider bg-slate-200/50 px-2 py-1 rounded">
                        {tier.labels.join(' + ')}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Min %</label>
                        <input
                          type="number"
                          value={tier.percentRange.min}
                          onChange={(e) => handleTierChange(idx, 'min', e.target.value)}
                          className="w-full p-2 text-xs bg-white border border-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Max %</label>
                        <input
                          type="number"
                          value={tier.percentRange.max}
                          onChange={(e) => handleTierChange(idx, 'max', e.target.value)}
                          className="w-full p-2 text-xs bg-white border border-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};
