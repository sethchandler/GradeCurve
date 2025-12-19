import React, { useState, useRef } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { DistributionResult } from '../types';
import { saveFile } from '../utils/fileExport';

interface GeminiReportProps {
    results: DistributionResult[];
    apiKey?: string;
    onApiKeyChange: (value: string) => void;
}

export const GeminiReport: React.FC<GeminiReportProps> = ({ results, apiKey, onApiKeyChange }) => {
    const [report, setReport] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const reportRef = useRef<HTMLDivElement>(null);

    const downloadMarkdown = async () => {
        if (!report) return;
        const blob = new Blob([report], { type: 'text/markdown' });
        await saveFile(blob, `GradeCurve_AI_Report_${new Date().toISOString().split('T')[0]}.md`);
    };

    const downloadPdf = async () => {
        if (!report || !reportRef.current) return;

        setLoading(true);
        try {
            // Capture the element as a canvas
            const canvas = await html2canvas(reportRef.current, {
                scale: 1.5, // Crisp enough but significantly reduces file size (from 18MB to ~1MB)
                useCORS: true,
                backgroundColor: '#0f172a',
                logging: false,
                onclone: (clonedDoc) => {
                    const el = clonedDoc.querySelector('[data-report-container]') as HTMLElement;
                    if (el) {
                        el.style.maxHeight = 'none';
                        el.style.overflow = 'visible';
                        el.style.padding = '40px';
                    }
                }
            });

            // Use high-quality JPEG compression for drastic size reduction
            const imgData = canvas.toDataURL('image/jpeg', 0.85);
            const pdf = new jsPDF({
                orientation: 'p',
                unit: 'mm',
                format: 'a4',
                compress: true
            });

            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.setFillColor(79, 70, 229);
            pdf.rect(0, 0, pdfWidth, 20, 'F');
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(14);
            pdf.text("GradeCurve Pro: AI Pedagogical Audit", 10, 13);

            pdf.addImage(imgData, 'JPEG', 0, 20, pdfWidth, pdfHeight, undefined, 'FAST');

            const pageHeight = pdf.internal.pageSize.getHeight();
            let heightLeft = pdfHeight + 20 - pageHeight;
            let position = -(pageHeight - 20);

            while (heightLeft > 0) {
                pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight, undefined, 'FAST');
                heightLeft -= pageHeight;
                position -= pageHeight;
            }

            const fileName = `GradeCurve_AI_Report_${new Date().toISOString().split('T')[0]}.pdf`;
            const pdfBlob = pdf.output('blob');
            await saveFile(pdfBlob, fileName);
        } catch (err) {
            console.error("PDF generation failed", err);
            setError("Failed to generate styled PDF.");
        } finally {
            setLoading(false);
        }
    };

    const generateReport = async () => {
        if (!apiKey) {
            setError("Please provide a Gemini API Key to run the analysis.");
            return;
        }
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
      Keep your analysis professional, concise, and focused on pedagogical signaling rather than math. 
      Format your response with Markdown (headers, bullet points, and strong text) for a professional report layout.`;

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
                    <div className="animate-in fade-in slide-in-from-bottom-2">
                        <div
                            ref={reportRef}
                            data-report-container
                            className="bg-slate-900/50 rounded-2xl p-8 border border-white/10 backdrop-blur-sm whitespace-normal leading-relaxed text-indigo-50/90 overflow-y-auto max-h-[500px] custom-scrollbar prose prose-invert prose-indigo max-w-none"
                        >
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {report}
                            </ReactMarkdown>
                        </div>
                        <div className="mt-6 flex flex-wrap items-center gap-4">
                            <button
                                onClick={() => setReport(null)}
                                className="text-indigo-300 hover:text-white text-sm font-bold flex items-center gap-2 group/btn"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transform group-hover/btn:-rotate-180 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                REGENERATE
                            </button>
                            <div className="h-4 w-px bg-white/10 mx-2"></div>
                            <button
                                onClick={downloadMarkdown}
                                className="text-indigo-300 hover:text-white text-[10px] font-black tracking-widest uppercase py-2 px-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                MARKDOWN
                            </button>
                            <button
                                onClick={downloadPdf}
                                disabled={loading}
                                className="text-indigo-900 bg-indigo-300 hover:bg-white text-[10px] font-black tracking-widest uppercase py-2 px-4 rounded-lg transition-all flex items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16h16M4 12h16m-7-4l3 3m0 0l-3 3m3-3H4" />
                                </svg>
                                {loading ? 'PREPARING PDF...' : 'EXPORT PREMIUM PDF'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-indigo-200 mb-6 max-w-md mx-auto leading-relaxed">
                            Use Gemini AI to analyze these scenarios from a pedagogical perspective.
                            <strong> A Gemini API Key is required to run this feature.</strong>
                        </p>

                        <div className="max-w-xs mx-auto mb-8">
                            <input
                                type="password"
                                placeholder="Paste your Gemini API Key here"
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 outline-none placeholder:text-indigo-300/50 text-white text-center"
                                value={apiKey || ''}
                                onChange={(e) => onApiKeyChange(e.target.value.trim())}
                            />
                            <a
                                href="https://aistudio.google.com/app/apikey"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-indigo-300 hover:text-white mt-2 block font-bold transition-colors"
                            >
                                GET AN API KEY FREE →
                            </a>
                        </div>

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
