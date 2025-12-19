import React from 'react';

interface ColumnMapperProps {
    columns: string[];
    scoreColumn: string;
    preservedColumns: string[];
    onSetScoreColumn: (col: string) => void;
    onTogglePreserved: (col: string) => void;
    onProceed: () => void;
}

export const ColumnMapper: React.FC<ColumnMapperProps> = ({
    columns,
    scoreColumn,
    preservedColumns,
    onSetScoreColumn,
    onTogglePreserved,
    onProceed
}) => {
    return (
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 animate-in zoom-in-95 duration-500">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Configure Your Data</h2>
                    <p className="text-slate-500">We detected {columns.length} columns in your file.</p>
                </div>
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <section>
                    <label className="block text-sm font-bold text-slate-700 mb-4 uppercase tracking-widest">
                        Select Raw Score Column
                        <span className="ml-2 inline-block px-1.5 py-0.5 bg-red-100 text-red-600 text-[10px] rounded">Required</span>
                    </label>
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                        {columns.map(col => (
                            <button
                                key={col}
                                onClick={() => onSetScoreColumn(col)}
                                className={`
                  w-full text-left px-5 py-4 rounded-2xl transition-all border-2 
                  ${scoreColumn === col
                                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-md ring-2 ring-indigo-200 ring-offset-2'
                                        : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200 hover:bg-white'
                                    }
                `}
                            >
                                <div className="flex items-center">
                                    <div className={`w-3 h-3 rounded-full mr-3 ${scoreColumn === col ? 'bg-indigo-500 animate-pulse' : 'bg-slate-300'}`}></div>
                                    <span className="font-semibold truncate">{col}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </section>

                <section>
                    <label className="block text-sm font-bold text-slate-700 mb-4 uppercase tracking-widest">
                        Preserve in Output
                        <span className="ml-2 inline-block px-1.5 py-0.5 bg-indigo-100 text-indigo-600 text-[10px] rounded">Optional</span>
                    </label>
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                        {columns.filter(c => c !== scoreColumn).map(col => (
                            <button
                                key={col}
                                onClick={() => onTogglePreserved(col)}
                                className={`
                  w-full text-left px-5 py-4 rounded-2xl transition-all border-2 flex items-center justify-between
                  ${preservedColumns.includes(col)
                                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                        : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200 hover:bg-white'
                                    }
                `}
                            >
                                <span className="font-medium truncate">{col}</span>
                                <div className={`
                   w-6 h-6 rounded-lg flex items-center justify-center transition-all
                   ${preservedColumns.includes(col) ? 'bg-emerald-500 text-white shadow-sm' : 'bg-slate-200 text-slate-400'}
                `}>
                                    {preservedColumns.includes(col) ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                                        </svg>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </section>
            </div>

            <div className="mt-12 flex justify-end">
                <button
                    disabled={!scoreColumn}
                    onClick={onProceed}
                    className="px-10 py-4 bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-2xl font-black shadow-xl shadow-indigo-200 hover:shadow-2xl hover:shadow-indigo-300 transform hover:-translate-y-1 transition-all disabled:opacity-50 disabled:translate-y-0"
                >
                    GENERATE DISTRIBUTIONS
                </button>
            </div>
        </div>
    );
};
