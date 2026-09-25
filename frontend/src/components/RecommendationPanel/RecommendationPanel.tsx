import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface Recommendations {
    risk_level: string;
    confidence_score: number;
    affected_population: number;
    affected_barangays: string[];
    recommended_actions: string[];
}

interface RecommendationPanelProps {
    onApprove: (action: string) => void;
    approvedActions?: string[];
}

const RecommendationPanel: React.FC<RecommendationPanelProps> = ({ onApprove, approvedActions = [] }) => {
    const [recs, setRecs] = useState<Recommendations | null>(null);
    const [lastExecutionTime, setLastExecutionTime] = useState<string>(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    );

    useEffect(() => {
        const fetchRecs = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/v1/copilot/recommendations`);
                setRecs(res.data);
                setLastExecutionTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
            } catch (e) { console.error('Failed to fetch recommendations', e); }
        };
        fetchRecs();
    }, []);

    if (!recs) return (
        <div className="h-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 shadow-xs">
            <div className="w-4 h-4 border-2 border-[#1976D2] border-t-transparent rounded-full animate-spin mb-2" aria-hidden="true"></div>
            <span className="text-[11px] font-mono">Loading Cortex Engine...</span>
        </div>
    );

    // Risk level badge styles
    const riskBadge =
        recs.risk_level?.toLowerCase().includes('red')
            ? 'bg-rose-50 dark:bg-rose-950/60 text-[#D32F2F] dark:text-rose-300 border-rose-200 dark:border-rose-900'
            : recs.risk_level?.toLowerCase().includes('orange') || recs.risk_level?.toLowerCase().includes('yellow')
            ? 'bg-amber-50 dark:bg-amber-950/60 text-[#ED6C02] dark:text-amber-300 border-amber-200 dark:border-amber-800'
            : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';

    const manualDirectives = Array.from(new Set([
        'Deploy 6 Inflatable Rescue Boats to Sector 3',
        'Open Evacuation Gymnasiums',
        ...recs.recommended_actions.filter(a => !a.toLowerCase().includes('broadcast') && !a.toLowerCase().includes('notification')),
    ]));

    return (
        <div className="h-full flex flex-col p-3 gap-2.5 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            {/* Header */}
            <div className="flex justify-between items-center pb-1.5 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" aria-hidden="true"></span>
                    <span className="font-semibold text-slate-900 dark:text-white text-xs uppercase tracking-wider">Tiered Guardrail Directives</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">Cortex RAG Engine</span>
            </div>

            {/* KPI Stats */}
            <div className="grid grid-cols-2 gap-2 shrink-0">
                <div className="p-2.5 rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 text-center flex flex-col items-center gap-1">
                    <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 tracking-wider">Alert Status</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border shadow-xs ${riskBadge}`}>
                        {recs.risk_level}
                    </span>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">{recs.confidence_score}% Confidence</div>
                </div>

                <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/90 text-center flex flex-col items-center gap-1">
                    <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 tracking-wider">Impact Radius</span>
                    <div className="text-lg font-extrabold font-mono tabular-nums text-slate-900 dark:text-white tracking-tight">{recs.affected_population.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">Affected Residents</div>
                </div>
            </div>

            {/* High-Risk Zones */}
            <div className="shrink-0">
                <div className="flex justify-between items-center text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    <span>High-Risk Zones</span>
                    <span className="font-mono">{recs.affected_barangays.length} Barangays</span>
                </div>
                <div className="flex flex-wrap gap-1 bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                    {recs.affected_barangays.map((b, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[10px] font-medium shadow-xs">{b}</span>
                    ))}
                </div>
            </div>

            {/* Directives */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-0.5">
                {/* Auto-Executed */}
                <div className="p-2.5 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 text-[#ED6C02] dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            <span className="text-[11px] font-extrabold text-[#ED6C02] dark:text-amber-400 uppercase tracking-wider">Fast-Path Automated Directives</span>
                        </div>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/60 text-[#ED6C02] dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[9px] font-mono font-bold shadow-xs">Auto {lastExecutionTime}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">Zero physical asset risk. SOP RAG rules automatically queued SMS/Email advisory &amp; responder staging on telemetry breach.</p>

                    {[
                        { icon: <svg className="w-3 h-3 text-[#ED6C02] dark:text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>, label: 'Public Multi-Channel Warning', sub: 'Localized SMS (<160 chars) & HTML Evacuation Email' },
                        { icon: <svg className="w-3 h-3 text-[#ED6C02] dark:text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>, label: 'First Responder Staging', sub: 'Stand by & gear up: Tumaga / Sta. Maria' },
                    ].map((item, idx) => (
                        <div key={idx} className="p-1.5 rounded-lg bg-white dark:bg-slate-800/80 border border-amber-200 dark:border-amber-800/60 flex justify-between items-center gap-2 shadow-xs">
                            <div className="flex flex-col gap-0.5 min-w-0">
                                <div className="flex items-center gap-1.5">{item.icon}<span className="text-slate-900 dark:text-white font-semibold text-xs">{item.label}</span></div>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{item.sub}</span>
                            </div>
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold shrink-0 shadow-xs">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                                Executed
                            </span>
                        </div>
                    ))}
                </div>

                {/* Guardrailed Manual */}
                <div className="p-2.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 text-[#1976D2] dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
                            <span className="text-[11px] font-extrabold text-[#1976D2] dark:text-blue-300 uppercase tracking-wider">Guardrailed Manual Directives</span>
                        </div>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-[#1976D2] dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[9px] font-mono font-bold shadow-xs">Physical Asset</span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">Requires human commander validation before committing physical rescue craft or facility assets.</p>

                    <div className="space-y-1.5">
                        {manualDirectives.map((action, idx) => {
                            const isApproved = approvedActions.includes(action);
                            return (
                                <div key={idx} className={`flex justify-between items-center p-2 border rounded-lg gap-2 transition-colors shadow-xs ${isApproved ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800' : 'bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-700/60 border-slate-200 dark:border-slate-700'}`}>
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <svg className="w-3 h-3 text-[#1976D2] dark:text-blue-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                                        <span className="text-slate-900 dark:text-white font-medium text-xs truncate">{action}</span>
                                    </div>
                                    {isApproved ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold shrink-0 shadow-xs">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                                            Approved
                                        </span>
                                    ) : (
                                        <button
                                            id={`approve-directive-${idx}`}
                                            onClick={() => onApprove(action)}
                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1976D2] hover:bg-[#1565C0] active:bg-[#0D47A1] text-white text-[10px] font-bold shrink-0 shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1976D2] transition-colors"
                                        >
                                            Approve &amp; Deploy
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RecommendationPanel;
