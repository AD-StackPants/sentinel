import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useTelemetryWebSocket } from '../../hooks/useTelemetryWebSocket';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface NotificationPanelProps {
    activeJobId: string | null;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ activeJobId }) => {
    const [status, setStatus] = useState<string>('idle');
    const [logs, setLogs] = useState<string[]>([]);
    const [counts, setCounts] = useState<{ sms?: number; email?: number }>({});
    const [filter, setFilter] = useState<'all' | 'sms' | 'email'>('all');
    const [copied, setCopied] = useState<boolean>(false);
    const [isLargeFont, setIsLargeFont] = useState<boolean>(false);
    const consoleEndRef = useRef<HTMLDivElement>(null);
    const { telemetry } = useTelemetryWebSocket();

    useEffect(() => {
        if (!activeJobId) return;
        const fetchInitialState = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/v1/jobs/${activeJobId}`);
                setStatus(res.data.status);
                setLogs(res.data.logs || []);
                if (res.data.counts) setCounts(res.data.counts);
            } catch (e) { console.error('Failed to fetch job status', e); }
        };
        fetchInitialState();
    }, [activeJobId]);

    useEffect(() => {
        if (telemetry && telemetry.type === 'job_log_update' && telemetry.job_id === activeJobId) {
            setStatus(telemetry.status);
            setLogs(prev => [...prev, telemetry.log]);
            if (telemetry.counts) setCounts(telemetry.counts);
        }
    }, [telemetry, activeJobId]);

    useEffect(() => {
        consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    const handleCopyLogs = () => {
        navigator.clipboard.writeText(logs.join('\n'));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const smsCount = counts.sms || 0;
    const emailCount = counts.email || 0;
    const smsPercent = Math.min(100, Math.round((smsCount / 1200) * 100));
    const emailPercent = Math.min(100, Math.round((emailCount / 3500) * 100));

    const filteredLogs = logs.filter(log => {
        if (filter === 'sms') return log.toLowerCase().includes('sms');
        if (filter === 'email') return log.toLowerCase().includes('email');
        return true;
    });

    const statusDotClass =
        status === 'completed' ? 'bg-emerald-500' :
        status === 'polling' || status === 'processing' ? 'bg-amber-500 animate-ping' :
        'bg-slate-400';

    return (
        <div className="h-full flex flex-col p-3 gap-2.5 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            {/* Header */}
            <div className="flex justify-between items-center pb-1.5 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${statusDotClass}`} aria-hidden="true"></span>
                    <span className="font-semibold text-slate-900 dark:text-white text-xs uppercase tracking-wider">Dispatch Console</span>
                    {activeJobId && (
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 ml-1 shadow-xs">
                            JOB: {activeJobId.substring(0, 8)}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1.5">
                    <button
                        id="font-size-toggle-btn"
                        onClick={() => setIsLargeFont(!isLargeFont)}
                        className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-[10px] font-mono text-slate-700 dark:text-slate-300 font-semibold transition-colors cursor-pointer shadow-xs"
                        aria-label={isLargeFont ? 'Decrease font size' : 'Increase font size'}
                    >
                        {isLargeFont ? 'A−' : 'A+'}
                    </button>
                    <button
                        id="copy-logs-btn"
                        onClick={handleCopyLogs}
                        className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-[10px] font-mono font-semibold transition-colors cursor-pointer shadow-xs"
                        aria-label="Copy logs to clipboard"
                    >
                        {copied ? <span className="text-emerald-600 dark:text-emerald-400">Copied</span> : <span className="text-slate-700 dark:text-slate-300">Copy</span>}
                    </button>
                    <div className="flex gap-0.5 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-md border border-slate-200 dark:border-slate-700 text-[10px] font-mono" role="group" aria-label="Log filter">
                        {(['all', 'sms', 'email'] as const).map((f) => (
                            <button
                                key={f}
                                id={`filter-${f}-btn`}
                                onClick={() => setFilter(f)}
                                className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer font-bold uppercase ${filter === f ? 'bg-[#1976D2] text-white shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                                aria-pressed={filter === f}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Progress meters */}
            <div className="grid grid-cols-2 gap-2 shrink-0">
                {/* SMS */}
                <div className="px-2.5 py-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                            <svg className="w-3 h-3 text-[#1976D2] dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 3v-3z" /></svg>
                            <span className="text-[11px] font-semibold text-slate-900 dark:text-white">SMS</span>
                        </div>
                        <span className="font-mono text-[10px] font-bold text-[#1976D2] dark:text-blue-300 tabular-nums">{smsCount.toLocaleString()} / 1,200 ({smsPercent}%)</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-sm h-1 overflow-hidden" role="progressbar" aria-valuenow={smsPercent} aria-valuemin={0} aria-valuemax={100}>
                        <div className="bg-[#1976D2] h-full rounded-sm transition-all duration-500 ease-out" style={{ width: `${smsPercent}%` }}></div>
                    </div>
                </div>

                {/* Email */}
                <div className="px-2.5 py-2 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                            <svg className="w-3 h-3 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            <span className="text-[11px] font-semibold text-slate-900 dark:text-white">Email</span>
                        </div>
                        <span className="font-mono text-[10px] font-bold text-emerald-700 dark:text-emerald-300 tabular-nums">{emailCount.toLocaleString()} / 3,500 ({emailPercent}%)</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-sm h-1 overflow-hidden" role="progressbar" aria-valuenow={emailPercent} aria-valuemin={0} aria-valuemax={100}>
                        <div className="bg-emerald-500 h-full rounded-sm transition-all duration-500 ease-out" style={{ width: `${emailPercent}%` }}></div>
                    </div>
                </div>
            </div>

            {/* Log Console */}
            <div
                className={`flex-1 overflow-y-auto bg-slate-950 dark:bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-slate-300 leading-relaxed space-y-1 transition-all ${isLargeFont ? 'text-sm' : 'text-[11px]'}`}
                role="log"
                aria-label="Dispatch log console"
                aria-live="polite"
            >
                {filteredLogs.length === 0 ? (
                    <div className="text-slate-500 italic flex flex-col items-center justify-center h-full gap-1.5 text-xs">
                        <span className="w-2 h-2 rounded-full bg-slate-700 animate-pulse" aria-hidden="true"></span>
                        <span>Awaiting operational dispatch command...</span>
                    </div>
                ) : (
                    filteredLogs.map((log, idx) => {
                        const isSms = log.includes('[SMS]');
                        const isEmail = log.includes('[Email]');
                        const isCompleted = log.toLowerCase().includes('complete') || log.includes('✅') || log.includes('🎯');
                        return (
                            <div key={idx} className="flex items-start gap-2 py-0.5 border-b border-slate-800/50 last:border-0">
                                <span className="text-slate-600 text-[10px] select-none mt-px" aria-hidden="true">$</span>
                                <span className={`break-all leading-normal ${isCompleted ? 'text-emerald-400 font-bold' : isSms ? 'text-blue-300 font-semibold' : isEmail ? 'text-emerald-300 font-semibold' : 'text-slate-300'}`}>{log}</span>
                            </div>
                        );
                    })
                )}
                {status === 'processing' && (
                    <div className="flex items-center gap-1.5 text-[#1976D2] text-[11px] font-bold pt-0.5" aria-live="polite">
                        <span aria-hidden="true">▌</span>
                        <span className="italic">Broadcasting live stream...</span>
                    </div>
                )}
                <div ref={consoleEndRef} />
            </div>
        </div>
    );
};

export default NotificationPanel;
