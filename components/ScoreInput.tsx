
import React, { useState } from 'react';

interface ScoreInputProps {
  onScoresLoaded: (scores: number[]) => void;
}

const ScoreInput: React.FC<ScoreInputProps> = ({ onScoresLoaded }) => {
  const [inputText, setInputText] = useState('');

  const handleProcess = () => {
    const scores = inputText
      .split(/[\s,]+/)
      .map(s => parseFloat(s))
      .filter(s => !isNaN(s));
    
    if (scores.length > 0) {
      onScoresLoaded(scores);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setInputText(text);
      const scores = text
        .split(/[\s,]+/)
        .map(s => parseFloat(s))
        .filter(s => !isNaN(s));
      onScoresLoaded(scores);
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <h2 className="text-lg font-semibold text-slate-800 mb-4">Ingest Scores</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Paste Scores (Comma or Space separated)
          </label>
          <textarea
            className="w-full h-32 p-3 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            placeholder="e.g. 95, 88, 72, 91..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="w-full sm:w-auto">
            <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-block text-center w-full">
              Upload CSV/TXT
              <input type="file" className="hidden" accept=".csv,.txt" onChange={handleFileUpload} />
            </label>
          </div>
          <button
            onClick={handleProcess}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium shadow-sm transition-all"
          >
            Generate Curve
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScoreInput;
