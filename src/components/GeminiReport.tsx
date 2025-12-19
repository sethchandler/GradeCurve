import React, { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { DistributionResult } from '../types';

interface GeminiReportProps {
    results: DistributionResult[];
    apiKey?: string;
}

export const GeminiReport: React.FC<GeminiReportProps> = ({ results, apiKey }) => {
    const [report, setReport] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generateReport = async () => {
        if (!apiKey) return;
        setLoading(true);
        setError(null);
        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

            const statsSummary = results.map((r, idx) => ({
                name: `Scenario ${idx + 1}`,
                mean: r.meanGpa,
                cutoffs: r.cutoffs,
                compliance: r.compliance
            }));

            const prompt = `As a pedagogical consultant for a Law Professor, evaluate these ${results.length} proposed grade distributions. 
      The target mean is around 3.3. 
      Data: ${JSON.stringify(statsSummary)}
      
      The grading algorithm has already handled the mathematical optimization to meet constraints. Your role is NOT to suggest different cutoffs or mathematical changes.
      
      Instead, provide a qualitative "Pedagogical Audit" for each Scenario:
      1. Highlight Positive Features: What makes this distribution "fair" or "balanced" from a student perspective?
      2. Identify Anomalies: Note any interesting clusters, gaps, or "tails" in the distribution that might affect student morale or faculty review.
      
      Refer to distributions as "Scenario 1", "Scenario 2", etc.
      Keep your analysis professional, concise, and focused on pedagogical signaling rather than math.`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            setReport(response.text());
        } catch (err: any) {
            let userMessage = "Failed to generate AI report.";
            if (err.message?.includes("API key not valid")) {
                userMessage += " Your API key appears to be invalid.";
            } else if (err.message) {
                userMessage += ` Error: ${err.message}`;
            } else {
                userMessage += " Please check your connection and API key.";
            }
            setError(userMessage);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (!apiKey) return null;

    return (
        <div className="mt-8 bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-indigo-500/20 transition-all duration-1000"></div>

            <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-black tracking-tight">AI Compliance Analysis</h3>
                </div>

                {report ? (
                    <div className="prose prose-invert max-w-none animate-in fade-in slide-in-from-bottom-2">
                        <div className="bg-white/5 rounded-2xl p-6 border border-white/10 backdrop-blur-sm whitespace-pre-wrap leading-relaxed text-indigo-50/90 font-medium">
                            {report}
                        </div>
                        <button
                            onClick={() => setReport(null)}
                            className="mt-6 text-indigo-300 hover:text-white text-sm font-bold flex items-center gap-2 group/btn"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transform group-hover/btn:-rotate-180 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Regenerate Analysis
                        </button>
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-indigo-200 mb-8 max-w-md mx-auto leading-relaxed">
                            Use Gemini AI to analyze these scenarios from a pedagogical perspective and identify potential friction points for faculty or students.
                        </p>
                        <button
                            onClick={generateReport}
                            disabled={loading}
                            className={`
                px-12 py-4 rounded-2xl font-black text-lg transition-all shadow-xl
                ${loading
                                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                    : 'bg-white text-indigo-900 hover:bg-indigo-50 hover:scale-105 active:scale-95 shadow-white/10'
                                }
              `}
                        >
                            {loading ? (
                                <div className="flex items-center gap-3">
                                    <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                                    ANALYZING SCENARIOS...
                                </div>
                            ) : "GENERATE AI REPORT"}
                        </button>
                        {error && <p className="mt-4 text-rose-400 text-sm font-bold flex items-center justify-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {error}
                        </p>}
                    </div>
                )}
            </div>
        </div>
    );
};
