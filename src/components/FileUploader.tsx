import React, { useCallback, useState } from 'react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { ScoreRow } from '../types';

interface FileUploaderProps {
    onDataLoaded: (data: ScoreRow[], columns: string[], filename: string) => void;
    onRawScoresInput: (labels: string, scores: number[]) => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onDataLoaded, onRawScoresInput }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [manualInput, setManualInput] = useState('');

    const processFile = async (file: File) => {
        const filename = file.name;
        const extension = filename.split('.').pop()?.toLowerCase();

        if (extension === 'csv') {
            Papa.parse(file, {
                header: true,
                dynamicTyping: true,
                complete: (results) => {
                    const columns = results.meta.fields || [];
                    onDataLoaded(results.data as any[], columns, filename);
                },
            });
        } else if (extension === 'xlsx' || extension === 'xls') {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

            // Get all rows as arrays to find the real header
            const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];

            // Heuristic: The header row is the first row that has > 2 non-empty cells
            // This skips title rows like "Law 550-001, Torts" which often only occupy one cell
            let headerIndex = rows.findIndex(row =>
                row.filter(cell => cell !== null && cell !== undefined && String(cell).trim() !== '').length > 2
            );

            // If no such row found, fallback to the very first row with data
            if (headerIndex === -1) headerIndex = 0;

            const headerRow = rows[headerIndex].map(h => String(h || '').trim());
            const dataRows = rows.slice(headerIndex + 1);

            const jsonData = dataRows
                .filter(row => row.some(cell => cell !== null && cell !== undefined && cell !== ''))
                .map(row => {
                    const obj: any = {};
                    headerRow.forEach((label, i) => {
                        if (label) obj[label] = row[i];
                    });
                    return obj;
                });

            const columns = headerRow.filter(h => h !== '');
            onDataLoaded(jsonData, columns, filename);
        } else {
            // Fallback: treat as text file with scores
            const text = await file.text();
            const scores = text.split(/[\s,]+/).map(Number).filter(n => !isNaN(n));
            onRawScoresInput(filename, scores);
        }
    };

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) processFile(file);
    }, []);

    const handleManualSubmit = () => {
        const scores = manualInput.split(/[\s,]+/).map(Number).filter(n => !isNaN(n));
        if (scores.length > 0) {
            onRawScoresInput("Manual Input", scores);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                className={`
          border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer
          ${isDragging
                        ? 'border-indigo-500 bg-indigo-50/30 scale-[0.99] shadow-inner'
                        : 'border-slate-300 hover:border-slate-400 bg-white/50 backdrop-blur-sm shadow-sm'
                    }
        `}
                onClick={() => document.getElementById('file-upload')?.click()}
            >
                <input
                    id="file-upload"
                    type="file"
                    accept=".csv,.xlsx,.xls,.txt"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
                />
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-indigo-200">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">Upload Scores</h3>
                    <p className="text-slate-500 mt-2 max-w-xs mx-auto">
                        Drop your Excel or CSV file here, or click to browse.
                    </p>
                    <span className="mt-4 px-4 py-1.5 bg-slate-100 text-slate-600 rounded-full text-xs font-medium uppercase tracking-wider">
                        Supports .xlsx, .csv, .txt
                    </span>
                </div>
            </div>

            <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center">
                    <span className="px-3 bg-slate-50 text-slate-400 text-sm font-medium">OR MANUAL ENTRY</span>
                </div>
            </div>

            <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-slate-100">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Paste Raw Scores</label>
                <textarea
                    placeholder="e.g. 95, 88, 76, 91, 84..."
                    className="w-full h-32 p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white/80"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                />
                <button
                    onClick={handleManualSubmit}
                    disabled={!manualInput.trim()}
                    className="mt-4 w-full py-3 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold transition-all disabled:opacity-50 shadow-md transform hover:-translate-y-0.5 active:translate-y-0"
                >
                    Process List
                </button>
            </div>
        </div>
    );
};
