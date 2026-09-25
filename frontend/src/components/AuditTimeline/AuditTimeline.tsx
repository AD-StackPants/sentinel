import React from 'react';

export interface AuditEvent {
    timestamp: Date;
    event: string;
    type: 'ai_assessment' | 'user_approval' | 'system_execution';
}

interface AuditTimelineProps {
    events: AuditEvent[];
}

const TYPE_CONFIG = {
    ai_assessment:    { dotColor: 'bg-amber-500',   labelColor: 'text-[#ED6C02] dark:text-amber-400',   label: 'AI Assessment' },
    user_approval:    { dotColor: 'bg-[#1976D2]',   labelColor: 'text-[#1976D2] dark:text-blue-300',    label: 'User Approval' },
    system_execution: { dotColor: 'bg-emerald-500', labelColor: 'text-emerald-700 dark:text-emerald-300', label: 'System Exec'  },
} satisfies Record<AuditEvent['type'], { dotColor: string; labelColor: string; label: string }>;

const AuditTimeline: React.FC<AuditTimelineProps> = ({ events }) => {
    const handleExport = () => {
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(events, null, 2))}`;
        const link = document.createElement('a');
        link.href = jsonString;
        link.download = `incident-report-${new Date().toISOString()}.json`;
        link.click();
    };

    return (
        <div className="h-full flex flex-col p-3 gap-2 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            {/* Header */}
            <div className="flex justify-between items-center pb-1.5 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true"></span>
                    <span className="font-semibold text-slate-900 dark:text-white text-xs uppercase tracking-wider">Audit Log</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        id="export-audit-btn"
                        onClick={handleExport}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-[#1976D2] dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 text-[10px] font-mono font-bold transition-colors cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1976D2]"
                        title="Export incident report as JSON"
                        aria-label="Export incident report"
                    >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Export
                    </button>
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                        <span className="font-bold tabular-nums text-slate-900 dark:text-white">{events.length}</span> Events
                    </span>
                </div>
            </div>

            {/* Timeline */}
            <div className="flex-1 overflow-y-auto pr-0.5" role="log" aria-label="Audit event timeline" aria-live="polite">
                {events.length === 0 ? (
                    <div className="text-xs text-slate-500 dark:text-slate-400 italic px-2 mt-2">No audit events yet.</div>
                ) : (
                    <div className="relative border-l border-slate-200 dark:border-slate-700 ml-2.5 my-1">
                        {events.map((ev, idx) => {
                            const config = TYPE_CONFIG[ev.type];
                            return (
                                <div key={idx} className="mb-3.5 ml-4 relative">
                                    <span
                                        className={`absolute flex items-center justify-center w-2.5 h-2.5 rounded-full left-[-21.5px] top-0.5 ring-2 ring-white dark:ring-slate-900 ${config.dotColor}`}
                                        aria-hidden="true"
                                    ></span>
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-xs font-semibold text-slate-900 dark:text-white leading-snug">{ev.event}</span>
                                        <div className="flex items-center gap-2">
                                            <time
                                                className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 tabular-nums shadow-xs"
                                                dateTime={ev.timestamp.toISOString()}
                                            >
                                                {ev.timestamp.toLocaleTimeString()}
                                            </time>
                                            <span className={`text-[9px] font-bold uppercase tracking-wider ${config.labelColor}`}>{config.label}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuditTimeline;
