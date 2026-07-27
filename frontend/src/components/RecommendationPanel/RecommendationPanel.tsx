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
                setLastExecutionTime(
                    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                );
            } catch (e) {
                console.error("Failed to fetch recommendations", e);
            }
        };
        fetchRecs();
    }, []);

    if (!recs) return (
        <div className="card h-full p-3 flex flex-col items-center justify-center text-neutral-foreground bg-card border-border">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mb-1"></div>
            <span className="text-xs font-mono">Loading Cortex Engine...</span>
        </div>
    );

    const manualDirectives = [
        "Deploy 6 Inflatable Rescue Boats to Sector 3",
        "Open Evacuation Gymnasiums",
        ...recs.recommended_actions.filter(
            a => !a.toLowerCase().includes("broadcast") && !a.toLowerCase().includes("notification")
        )
    ];
    // Deduplicate manual directives
    const uniqueManualDirectives = Array.from(new Set(manualDirectives));

    return (
        <div className="card h-full flex flex-col p-3 gap-2 overflow-hidden border-border bg-card shadow-xs">
            {/* Subtle Compact Card Header */}
            <div className="flex justify-between items-center pb-1.5 border-b border-border/50 text-xs shrink-0">
                <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse"></span>
                    <span className="font-semibold text-foreground text-xs uppercase tracking-wider">Tiered Guardrail Directives</span>
                </div>
                <span className="text-[10px] font-mono text-neutral-foreground">CORTEX RAG ENGINE</span>
            </div>

            {/* Metric Stat Cards */}
            <div className="grid grid-cols-2 gap-2 shrink-0">
                <div className="p-2 rounded-lg border border-danger/30 bg-danger/10 text-center flex flex-col items-center justify-center">
                    <span className="text-[10px] uppercase font-semibold text-danger tracking-wider">Alert Status</span>
                    <span className="badge badge-danger text-xs font-bold px-2 py-0.5 mt-0.5">{recs.risk_level}</span>
                    <div className="text-[10px] text-neutral-foreground font-mono mt-0.5">
                        {recs.confidence_score}% Confidence
                    </div>
                </div>

                <div className="p-2 rounded-lg border border-border bg-neutral/15 text-center flex flex-col items-center justify-center">
                    <span className="text-[10px] uppercase font-semibold text-neutral-foreground tracking-wider">Impact Radius</span>
                    <div className="text-base font-extrabold text-foreground tracking-tight">{recs.affected_population.toLocaleString()}</div>
                    <div className="text-[10px] text-neutral-foreground">Affected Residents</div>
                </div>
            </div>

            {/* Barangays List */}
            <div className="text-xs space-y-0.5 shrink-0">
                <div className="flex justify-between items-center text-neutral-foreground text-[10px] uppercase font-semibold">
                    <span>High Risk Zones:</span>
                    <span className="font-mono">{recs.affected_barangays.length} Barangays</span>
                </div>
                <div className="flex flex-wrap gap-1 bg-neutral/10 p-1.5 rounded-lg border border-border/60">
                    {recs.affected_barangays.map((b, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded bg-card text-foreground border border-border text-[10px] font-medium">
                            {b}
                        </span>
                    ))}
                </div>
            </div>

            {/* Main Tiered Directives Area */}
            <div className="card-content flex-1 overflow-y-auto pr-1 space-y-3">
                {/* SECTION 1: ⚡ Fast-Path Automated Directives (Zero Physical Risk) */}
                <div className="p-2 rounded-xl border border-warning/40 bg-warning/5 space-y-1.5 shadow-inner">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs">⚡</span>
                            <span className="text-[11px] font-extrabold text-warning uppercase tracking-wider">
                                Fast-Path Automated Directives
                            </span>
                        </div>
                        <span className="px-1.5 py-0.5 rounded bg-warning/20 text-warning border border-warning/40 text-[9px] font-mono font-bold tracking-tight">
                            ⚡ AUTO-EXECUTED & STAGED ({lastExecutionTime})
                        </span>
                    </div>
                    <p className="text-[10px] text-neutral-foreground leading-tight">
                        Zero physical asset risk. SOP RAG rules automatically queued SMS/Email advisory & responder staging on telemetry breach.
                    </p>

                    <div className="space-y-1 mt-1">
                        {/* Automated Directive 1: Public Warning */}
                        <div className="p-1.5 rounded-lg bg-card/80 border border-warning/30 flex justify-between items-center text-xs">
                            <div className="flex flex-col">
                                <span className="text-foreground font-semibold text-xs flex items-center gap-1">
                                    <span className="text-warning text-[10px]">📱</span> Public Multi-Channel Warning
                                </span>
                                <span className="text-[10px] text-neutral-foreground font-mono">
                                    Localized SMS (&lt;160 chars) & HTML Evacuation Email
                                </span>
                            </div>
                            <span className="px-2 py-0.5 rounded bg-success/20 text-success border border-success/40 text-[10px] font-bold shrink-0">
                                ⚡ EXECUTED
                            </span>
                        </div>

                        {/* Automated Directive 2: First Responder Staging */}
                        <div className="p-1.5 rounded-lg bg-card/80 border border-warning/30 flex justify-between items-center text-xs">
                            <div className="flex flex-col">
                                <span className="text-foreground font-semibold text-xs flex items-center gap-1">
                                    <span className="text-warning text-[10px]">🚨</span> First Responder Staging Notification
                                </span>
                                <span className="text-[10px] text-neutral-foreground font-mono">
                                    STAND BY & GEAR UP: Staging at Tumaga / Sta. Maria
                                </span>
                            </div>
                            <span className="px-2 py-0.5 rounded bg-success/20 text-success border border-success/40 text-[10px] font-bold shrink-0">
                                ⚡ STAGED
                            </span>
                        </div>
                    </div>
                </div>

                {/* SECTION 2: 🛡️ Guardrailed Manual Directives (Physical Asset Deployment) */}
                <div className="p-2 rounded-xl border border-primary/40 bg-primary/5 space-y-1.5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs">🛡️</span>
                            <span className="text-[11px] font-extrabold text-primary uppercase tracking-wider">
                                Guardrailed Manual Directives
                            </span>
                        </div>
                        <span className="px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/40 text-[9px] font-mono font-bold tracking-tight">
                            PHYSICAL ASSET COMMITMENT
                        </span>
                    </div>
                    <p className="text-[10px] text-neutral-foreground leading-tight">
                        Requires human commander validation before committing physical rescue craft or facility assets.
                    </p>

                    <div className="space-y-1.5 mt-1">
                        {uniqueManualDirectives.map((action, idx) => {
                            const isApproved = approvedActions.includes(action);
                            return (
                                <div
                                    key={idx}
                                    className={`flex justify-between items-center p-2 border rounded-lg text-xs transition-all ${
                                        isApproved
                                            ? 'bg-success/10 border-success/30'
                                            : 'bg-card hover:bg-neutral/10 border-border/80'
                                    }`}
                                >
                                    <div className="flex items-center gap-1.5 pr-2">
                                        <span className="text-primary text-[10px]">🛥️</span>
                                        <span className="text-foreground font-medium text-xs">{action}</span>
                                    </div>
                                    {isApproved ? (
                                        <span className="px-2.5 py-0.5 rounded bg-success/20 text-success border border-success/40 text-[10px] font-bold shrink-0 flex items-center gap-1">
                                            ✓ Approved & Deployed
                                        </span>
                                    ) : (
                                        <button
                                            onClick={() => onApprove(action)}
                                            className="button button-primary button-sm text-[10px] font-bold px-2.5 py-1 shrink-0 flex items-center gap-1 shadow-xs"
                                        >
                                            <span>Approve & Deploy</span>
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
