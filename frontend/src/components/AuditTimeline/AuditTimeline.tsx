import React from 'react';

export interface AuditEvent {
    timestamp: Date;
    event: string;
    type: 'ai_assessment' | 'user_approval' | 'system_execution';
}

interface AuditTimelineProps {
    events: AuditEvent[];
}

const AuditTimeline: React.FC<AuditTimelineProps> = ({ events }) => {
    return (
        <div className="card h-full flex flex-col p-3 gap-2 overflow-hidden border-border bg-card shadow-xs">
            {/* Subtle Compact Card Header */}
            <div className="flex justify-between items-center pb-1.5 border-b border-border/50 text-xs">
                <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
                    <span className="font-semibold text-foreground text-xs uppercase tracking-wider">Audit Log</span>
                </div>
                <span className="text-[10px] font-mono text-neutral-foreground">{events.length} EVENTS</span>
            </div>

            <div className="card-content flex-1 overflow-y-auto pr-1">
                <div className="relative border-l border-border/80 ml-2.5 my-1">
                    {events.map((ev, idx) => (
                        <div key={idx} className="mb-3.5 ml-4 relative">
                            {/* Subtle glowing node */}
                            <span className={`absolute flex items-center justify-center w-2.5 h-2.5 rounded-full -left-[21.5px] top-0.5 ring-2 ring-card ${
                                ev.type === 'ai_assessment' ? 'bg-warning' :
                                ev.type === 'user_approval' ? 'bg-primary' : 'bg-success'
                            }`}>
                            </span>
                            <div className="flex flex-col">
                                <span className="text-xs font-semibold text-foreground leading-snug">
                                    {ev.event}
                                </span>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <time className="text-[10px] font-mono text-neutral-foreground bg-neutral/10 px-1 py-0.5 rounded border border-border/60">
                                        {ev.timestamp.toLocaleTimeString()}
                                    </time>
                                    <span className={`text-[9px] font-bold uppercase tracking-wider ${
                                        ev.type === 'ai_assessment' ? 'text-warning' :
                                        ev.type === 'user_approval' ? 'text-primary' : 'text-success'
                                    }`}>
                                        {ev.type.replace('_', ' ')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {events.length === 0 && (
                        <div className="text-xs text-neutral-foreground ml-3 italic">No audit events.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuditTimeline;
