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
}

const RecommendationPanel: React.FC<RecommendationPanelProps> = ({ onApprove }) => {
    const [recs, setRecs] = useState<Recommendations | null>(null);

    useEffect(() => {
        const fetchRecs = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/v1/copilot/recommendations`);
                setRecs(res.data);
            } catch (e) {
                console.error("Failed to fetch recommendations", e);
            }
        };
        fetchRecs();
    }, []);

    if (!recs) return (
        <div className="card h-full p-3 flex flex-col items-center justify-center text-neutral-foreground bg-card border-border">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mb-1"></div>
            <span className="text-xs font-mono">Loading...</span>
        </div>
    );

    return (
        <div className="card h-full flex flex-col p-3 gap-2 overflow-hidden border-border bg-card shadow-xs">
            {/* Subtle Compact Card Header */}
            <div className="flex justify-between items-center pb-1.5 border-b border-border/50 text-xs">
                <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-warning"></span>
                    <span className="font-semibold text-foreground text-xs uppercase tracking-wider">Active Recommendations</span>
                </div>
                <span className="text-[10px] font-mono text-neutral-foreground">CORTEX ENGINE</span>
            </div>

            {/* Metric Stat Cards */}
            <div className="grid grid-cols-2 gap-2">
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
            <div className="text-xs space-y-0.5">
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

            {/* Action Items */}
            <div className="card-content flex-1 overflow-y-auto pr-1 space-y-1.5">
                <strong className="text-[10px] text-neutral-foreground uppercase tracking-wider block">Directives:</strong>
                <div className="flex flex-col gap-1.5">
                    {recs.recommended_actions.map((action, idx) => (
                        <div key={idx} className="flex justify-between items-center p-2 bg-neutral/10 hover:bg-neutral/20 border border-border/70 rounded-lg text-xs transition-colors">
                            <span className="text-foreground font-medium text-xs pr-2">{action}</span>
                            <button
                                onClick={() => onApprove(action)}
                                className="button button-primary button-sm text-[10px] font-semibold px-2.5 py-0.5 shrink-0"
                            >
                                Approve
                            </button>
                        </div>
                    ))}
                    <div className="flex justify-between items-center p-2 bg-primary/10 hover:bg-primary/15 border border-primary/30 rounded-lg text-xs transition-colors">
                        <div className="flex flex-col">
                            <span className="text-foreground font-semibold text-xs">Dispatch Alerts</span>
                            <span className="text-[10px] text-neutral-foreground font-mono">SMS & Email Broadcast</span>
                        </div>
                        <button
                            onClick={() => onApprove("Dispatch Notifications")}
                            className="button button-secondary button-sm text-[10px] font-semibold px-2.5 py-0.5 shrink-0"
                        >
                            Approve
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RecommendationPanel;
