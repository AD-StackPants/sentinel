import React from 'react';

export interface AuditEvent {
    timestamp: Date;
    event: string;
    type: 'ai_assessment' | 'user_approval' | 'system_execution';
}

const AuditTimeline: React.FC<{ events: AuditEvent[] }> = ({ events }) => {
    return (
        <div className="p-4 border rounded shadow bg-white h-full overflow-y-auto">
            <h2 className="font-bold text-lg border-b pb-2 mb-4">Operational Audit Timeline</h2>
            <div className="relative border-l-2 border-gray-200 ml-3">
                {events.map((ev, idx) => (
                    <div key={idx} className="mb-6 ml-6">
                        <span className={`absolute flex items-center justify-center w-4 h-4 rounded-full -left-[9px] ring-4 ring-white
                            ${ev.type === 'ai_assessment' ? 'bg-purple-500' :
                              ev.type === 'user_approval' ? 'bg-blue-500' : 'bg-green-500'}`}
                        >
                        </span>
                        <h3 className="flex items-center mb-1 text-sm font-semibold text-gray-900">
                            {ev.event}
                        </h3>
                        <time className="block mb-2 text-xs font-normal leading-none text-gray-400">
                            {ev.timestamp.toLocaleTimeString()}
                        </time>
                    </div>
                ))}
                {events.length === 0 && (
                    <div className="text-sm text-gray-500 ml-4">No events recorded yet.</div>
                )}
            </div>
        </div>
    );
};

export default AuditTimeline;
