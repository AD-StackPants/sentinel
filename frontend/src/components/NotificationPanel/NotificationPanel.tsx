import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface NotificationPanelProps {
    activeJobId: string | null;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ activeJobId }) => {
    const [status, setStatus] = useState<string>('idle');
    const [logs, setLogs] = useState<string[]>([]);
    const [counts, setCounts] = useState<{sms?: number, email?: number}>({});
    const [filter, setFilter] = useState<'all' | 'sms' | 'email'>('all');
    const [copied, setCopied] = useState<boolean>(false);
    const [isLargeFont, setIsLargeFont] = useState<boolean>(false);
    const consoleEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!activeJobId) return;

        setStatus('polling');

        const interval = setInterval(async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/v1/jobs/${activeJobId}`);
                setStatus(res.data.status);
                setLogs(res.data.logs || []);
                if (res.data.counts) {
                    setCounts(res.data.counts);
                }

                if (res.data.status === 'completed' || res.data.status === 'error') {
                    clearInterval(interval);
                }
            } catch (e) {
                console.error("Failed to poll job status", e);
                clearInterval(interval);
            }
        }, 350);

        return () => clearInterval(interval);
    }, [activeJobId]);

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

    return (
        <div className="card h-full flex flex-col p-3 gap-2 overflow-hidden border-border bg-card shadow-xs">
            {/* Subtle Compact Card Header */}
            <div className="flex justify-between items-center pb-1.5 border-b border-border/50 text-xs shrink-0">
                <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                        status === 'completed' ? 'bg-success' : status === 'polling' || status === 'processing' ? 'bg-warning animate-ping' : 'bg-neutral-foreground'
                    }`}></span>
                    <span className="font-semibold text-foreground text-xs uppercase tracking-wider">Dispatch Console</span>
                    {activeJobId && (
                        <span className="text-[10px] text-neutral-foreground font-mono bg-neutral/15 px-1.5 py-0.5 rounded ml-1">
                            JOB: {activeJobId.substring(0, 8)}
                        </span>
                    )}
                </div>

                {/* Compact Controls: Filter & Text Size */}
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={() => setIsLargeFont(!isLargeFont)}
                        className="px-1.5 py-0.5 rounded bg-neutral/15 hover:bg-neutral/25 border border-border text-[10px] font-mono text-foreground font-semibold"
                        title="Toggle Text Size"
                    >
                        {isLargeFont ? 'A-' : 'A+'}
                    </button>

                    <button
                        onClick={handleCopyLogs}
                        className="px-1.5 py-0.5 rounded bg-neutral/15 hover:bg-neutral/25 border border-border text-[10px] font-mono text-foreground font-semibold"
                    >
                        {copied ? '✓' : 'Copy'}
                    </button>

                    <div className="flex gap-0.5 bg-neutral/15 p-0.5 rounded-md border border-border text-[10px] font-mono">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-1.5 py-0.5 rounded transition-all ${filter === 'all' ? 'bg-primary text-primary-foreground font-bold' : 'hover:text-foreground'}`}
                        >
                            ALL
                        </button>
                        <button
                            onClick={() => setFilter('sms')}
                            className={`px-1.5 py-0.5 rounded transition-all ${filter === 'sms' ? 'bg-primary text-primary-foreground font-bold' : 'hover:text-foreground'}`}
                        >
                            SMS
                        </button>
                        <button
                            onClick={() => setFilter('email')}
                            className={`px-1.5 py-0.5 rounded transition-all ${filter === 'email' ? 'bg-primary text-primary-foreground font-bold' : 'hover:text-foreground'}`}
                        >
                            EMAIL
                        </button>
                    </div>
                </div>
            </div>

            {/* Compact Telemetry Meters */}
            <div className="grid grid-cols-2 gap-2 shrink-0">
                <div className="px-2.5 py-1.5 rounded-lg border border-primary/20 bg-primary/5 flex flex-col gap-1">
                    <div className="flex justify-between items-center text-[11px]">
                        <span className="font-semibold text-foreground flex items-center gap-1">
                            <span className="text-primary text-[10px]">📱</span> SMS
                        </span>
                        <span className="font-mono text-[11px] font-bold text-primary">
                            {smsCount.toLocaleString()} / 1,200 ({smsPercent}%)
                        </span>
                    </div>
                    <div className="w-full bg-neutral/20 rounded-full h-1 overflow-hidden">
                        <div className="bg-primary h-1 rounded-full transition-all duration-400 ease-out" style={{ width: `${smsPercent}%` }}></div>
                    </div>
                </div>

                <div className="px-2.5 py-1.5 rounded-lg border border-accent/20 bg-accent/5 flex flex-col gap-1">
                    <div className="flex justify-between items-center text-[11px]">
                        <span className="font-semibold text-foreground flex items-center gap-1">
                            <span className="text-accent-foreground text-[10px]">✉️</span> Email
                        </span>
                        <span className="font-mono text-[11px] font-bold text-accent-foreground">
                            {emailCount.toLocaleString()} / 3,500 ({emailPercent}%)
                        </span>
                    </div>
                    <div className="w-full bg-neutral/20 rounded-full h-1 overflow-hidden">
                        <div className="bg-accent h-1 rounded-full transition-all duration-400 ease-out" style={{ width: `${emailPercent}%` }}></div>
                    </div>
                </div>
            </div>

            {/* EXPANDED MAXIMUM DATA LOG CONSOLE */}
            <div className={`card-content flex-1 overflow-y-auto bg-neutral/30 p-3 rounded-xl border border-border/90 font-mono text-foreground leading-relaxed space-y-1.5 shadow-inner transition-all ${
                isLargeFont ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'
            }`}>
                {filteredLogs.length === 0 ? (
                    <div className="text-neutral-foreground italic flex flex-col items-center justify-center h-full gap-1 text-xs sm:text-sm">
                        <span className="w-2.5 h-2.5 rounded-full bg-primary animate-ping"></span>
                        <span>Awaiting operational dispatch command...</span>
                    </div>
                ) : (
                    filteredLogs.map((log, idx) => {
                        const isSms = log.includes('[SMS]');
                        const isEmail = log.includes('[Email]');
                        const isCompleted = log.includes('✅') || log.includes('🎯');

                        return (
                            <div key={idx} className="flex items-start gap-2 animate-in fade-in duration-150 py-0.5 border-b border-border/20 last:border-0">
                                <span className="text-neutral-foreground font-mono text-xs select-none mt-0.5">$</span>
                                <span className={`break-all font-mono leading-normal ${
                                    isCompleted ? 'text-success font-bold' :
                                    isSms ? 'text-primary font-semibold' :
                                    isEmail ? 'text-accent-foreground font-semibold' : 'text-foreground'
                                }`}>
                                    {log}
                                </span>
                            </div>
                        );
                    })
                )}
                {status === 'processing' && (
                    <div className="flex items-center gap-1.5 text-primary animate-pulse text-xs font-bold pt-0.5">
                        <span>▌</span>
                        <span className="text-[11px] italic">Broadcasting live stream...</span>
                    </div>
                )}
                <div ref={consoleEndRef} />
            </div>
        </div>
    );
};

export default NotificationPanel;
