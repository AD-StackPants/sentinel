import React, { useState, useEffect } from 'react';
import ChatInterface, { type ChatMessage } from '../ChatInterface/ChatInterface';
import DisasterMap from '../DisasterMap/DisasterMap';
import RecommendationPanel from '../RecommendationPanel/RecommendationPanel';
import NotificationPanel from '../NotificationPanel/NotificationPanel';
import AuditTimeline, { type AuditEvent } from '../AuditTimeline/AuditTimeline';
import axios from 'axios';
import { getAuthHeader } from '../../firebase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
type ViewMode = 'overview' | 'map' | 'copilot' | 'dispatch';

const NAV_TABS: { id: ViewMode; label: string; shortcut: string; icon: React.ReactNode }[] = [
    {
        id: 'overview', label: 'Overview', shortcut: '1',
        icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
    },
    {
        id: 'map', label: 'Map Focus', shortcut: '2',
        icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6-10l6 3m0 10l5.447-2.724A1 1 0 0021 16.382V5.618a1 1 0 00-1.447-.894L15 7m0 13V7" /></svg>,
    },
    {
        id: 'copilot', label: 'Copilot Focus', shortcut: '3',
        icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
    },
    {
        id: 'dispatch', label: 'Dispatch & Audit', shortcut: '4',
        icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
    },
];

const OperationalDashboard: React.FC = () => {
    const [viewMode, setViewMode] = useState<ViewMode>('overview');
    const [activeJobId, setActiveJobId] = useState<string | null>(null);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [approvedActions, setApprovedActions] = useState<string[]>(() => {
        try { const s = localStorage.getItem('sentinel_approved_actions'); return s ? JSON.parse(s) : []; }
        catch { return []; }
    });
    const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([
        { timestamp: new Date(), event: 'System Initialized', type: 'system_execution' }
    ]);

    useEffect(() => {
        const fetchInitialAuditData = async () => {
            try {
                const headers = await getAuthHeader();
                const [dirRes, evtRes, chatRes] = await Promise.all([
                    axios.get(`${API_BASE_URL}/api/v1/audit/approved-directives`, { headers }),
                    axios.get(`${API_BASE_URL}/api/v1/audit/events`, { headers }),
                    axios.get(`${API_BASE_URL}/api/v1/copilot/history?session_id=default_session`, { headers })
                ]);
                if (dirRes.data?.approved_directives && Array.isArray(dirRes.data.approved_directives)) {
                    setApprovedActions(prev => { const m = Array.from(new Set([...prev, ...dirRes.data.approved_directives])); localStorage.setItem('sentinel_approved_actions', JSON.stringify(m)); return m; });
                }
                if (evtRes.data?.events && Array.isArray(evtRes.data.events) && evtRes.data.events.length > 0) {
                    setAuditEvents(evtRes.data.events.map((e: any) => ({ timestamp: new Date(e.timestamp), event: e.event, type: e.type as AuditEvent['type'] })));
                }
                if (Array.isArray(chatRes.data) && chatRes.data.length > 0) {
                    setChatMessages(chatRes.data.map((item: any) => {
                        let fullText = item.text || item.response || '';
                        if (item.explanation) fullText += `\n\n**Reasoning**: ${item.explanation}`;
                        return { role: item.sender === 'user' ? 'user' : 'ai', text: fullText, recommendations: item.recommended_actions || undefined };
                    }));
                }
            } catch (err) {
                console.error('Failed to load initial operational data from backend', err);
            } finally {
                setIsInitialLoading(false);
            }
        };
        fetchInitialAuditData();
    }, []);

    const handleSendChatMessage = async (queryText: string) => {
        if (!queryText.trim()) return;
        addEvent('AI Risk Assessment Requested', 'ai_assessment');
        setChatMessages(prev => [...prev, { role: 'user', text: queryText }]);
        setIsChatLoading(true);
        try {
            const headers = await getAuthHeader();
            const response = await axios.post(`${API_BASE_URL}/api/v1/copilot/ask`, { query: queryText, session_id: 'default_session' }, { headers });
            const ai = response.data;
            let fullText = ai.response;
            if (ai.explanation) fullText += `\n\n**Reasoning**: ${ai.explanation}`;
            setChatMessages(prev => [...prev, { role: 'ai', text: fullText, recommendations: ai.recommended_actions }]);
        } catch (error) {
            console.error('Error asking copilot', error);
            setChatMessages(prev => [...prev, { role: 'error', text: 'Connection to Sentinel AI backend failed.' }]);
        } finally {
            setIsChatLoading(false);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
            if (e.key === '1') setViewMode('overview');
            if (e.key === '2') setViewMode('map');
            if (e.key === '3') setViewMode('copilot');
            if (e.key === '4') setViewMode('dispatch');
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const addEvent = async (event: string, type: AuditEvent['type']) => {
        setAuditEvents(prev => [{ timestamp: new Date(), event, type }, ...prev]);
        try {
            const headers = await getAuthHeader();
            await axios.post(`${API_BASE_URL}/api/v1/audit/log`, { event, event_type: type }, { headers });
        } catch (e) { console.error('Failed to persist audit log', e); }
    };

    const handleApproveAction = async (action: string) => {
        setApprovedActions(prev => {
            if (prev.includes(action)) return prev;
            const updated = [...prev, action];
            try { localStorage.setItem('sentinel_approved_actions', JSON.stringify(updated)); } catch (e) { console.error(e); }
            return updated;
        });
        addEvent(`User Approved Directive: ${action}`, 'user_approval');
        addEvent('Queueing Broadcast Job to Notification Engine...', 'system_execution');
        try {
            const headers = await getAuthHeader();
            const jobRes = await axios.post(`${API_BASE_URL}/api/v1/jobs/`, { messages: [`EMERGENCY ADVISORY (ZAMBOANGA): ${action}. Proceed to safety centers immediately.`], channels: ['sms', 'email'], recipients_filter: 'tumaga_stamaria_tetuan' }, { headers });
            const newJobId = jobRes.data.job_id;
            setActiveJobId(newJobId);
            addEvent(`Job ${newJobId.substring(0, 8)} Dispatch Active`, 'system_execution');
        } catch (e) {
            console.error('Failed to execute job', e);
            addEvent('Job Dispatch Execution Failed', 'system_execution');
        }
    };

    const [celeryStatus, setCeleryStatus] = useState<string | null>(null);
    const [isCelerySyncing, setIsCelerySyncing] = useState(false);

    const handleCelerySync = async () => {
        setIsCelerySyncing(true);
        setCeleryStatus('Dispatching Celery Task...');
        addEvent('Celery Task Dispatched: Sync Live PH Weather to Snowflake', 'system_execution');
        try {
            const res = await axios.post(`${API_BASE_URL}/api/v1/ingestion/sync-weather`);
            const taskId = res.data.task_id;
            setCeleryStatus(`Task ${taskId.substring(0, 8)} Executing...`);
            setTimeout(async () => {
                try {
                    const statusRes = await axios.get(`${API_BASE_URL}/api/v1/ingestion/status/${taskId}`);
                    if (statusRes.data.ready) { setCeleryStatus('Snowflake Synced via Celery'); addEvent('Celery Worker Complete: Live PH Telemetry Synced to Snowflake', 'system_execution'); }
                    else setCeleryStatus('Task Running in Background');
                } catch { setCeleryStatus('Snowflake Ingested'); }
                finally { setIsCelerySyncing(false); }
            }, 1500);
        } catch (err) {
            console.error('Celery sync failed', err);
            setCeleryStatus('Celery Ingestion Error');
            setIsCelerySyncing(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#F8FAFC] dark:bg-slate-950 gap-3 overflow-hidden">
            {/* Tab Bar */}
            <nav className="flex items-center justify-between px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs" aria-label="Operational view tabs">
                <div className="flex items-center gap-1" role="tablist">
                    <span className="text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mr-2 hidden sm:inline">View:</span>
                    {NAV_TABS.map((tab) => (
                        <button
                            key={tab.id}
                            id={`tab-${tab.id}`}
                            role="tab"
                            aria-selected={viewMode === tab.id}
                            onClick={() => setViewMode(tab.id)}
                            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1976D2] ${
                                viewMode === tab.id
                                    ? 'bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-[#1976D2] dark:text-blue-300 shadow-xs'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'
                            }`}
                        >
                            {tab.icon}
                            <span className="hidden sm:inline">{tab.label}</span>
                            <span className={`text-[9px] px-1 py-px rounded-md font-mono font-bold ${viewMode === tab.id ? 'bg-blue-100 dark:bg-blue-900/60 text-[#1976D2] dark:text-blue-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`} aria-hidden="true">{tab.shortcut}</span>
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        id="celery-ingest-btn"
                        onClick={handleCelerySync}
                        disabled={isCelerySyncing}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-[#1976D2] dark:text-blue-300 shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1976D2]"
                    >
                        <svg className={`w-3.5 h-3.5 ${isCelerySyncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        <span>{isCelerySyncing ? 'Syncing...' : 'Celery Ingest'}</span>
                    </button>

                    {celeryStatus && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-xs" role="status">{celeryStatus}</span>
                    )}

                    {isInitialLoading ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-[10px] font-mono font-semibold text-[#1976D2] dark:text-blue-300 shadow-xs" role="status" aria-live="polite">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#1976D2] animate-ping" aria-hidden="true"></span>
                            Syncing Snowflake DB...
                        </div>
                    ) : (
                        <div className="hidden lg:flex items-center gap-1.5 text-[10px] font-mono text-slate-500 dark:text-slate-400">
                            <span>Hotkeys:</span>
                            <kbd className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[10px] shadow-xs">[1–4]</kbd>
                        </div>
                    )}
                </div>
            </nav>

            {/* Tab Viewport */}
            <div className="flex-1 overflow-hidden" role="tabpanel">
                {viewMode === 'overview' && (
                    <div className="flex flex-col h-full gap-3 animate-in fade-in duration-200">
                        <div className="flex h-3/5 gap-3">
                            <div className="w-2/3 h-full"><DisasterMap /></div>
                            <div className="w-1/3 h-full"><RecommendationPanel onApprove={handleApproveAction} approvedActions={approvedActions} /></div>
                        </div>
                        <div className="flex h-2/5 gap-3">
                            <div className="w-1/3 h-full"><ChatInterface messages={chatMessages} onSendMessage={handleSendChatMessage} isLoading={isChatLoading} isInitialLoading={isInitialLoading} onApproveAction={handleApproveAction} onAiQuery={() => addEvent('AI Risk Assessment Requested', 'ai_assessment')} approvedActions={approvedActions} /></div>
                            <div className="w-1/3 h-full"><NotificationPanel activeJobId={activeJobId} /></div>
                            <div className="w-1/3 h-full"><AuditTimeline events={auditEvents} /></div>
                        </div>
                    </div>
                )}
                {viewMode === 'map' && (
                    <div className="flex h-full gap-3 animate-in fade-in duration-200">
                        <div className="w-3/4 h-full"><DisasterMap /></div>
                        <div className="w-1/4 h-full"><RecommendationPanel onApprove={handleApproveAction} approvedActions={approvedActions} /></div>
                    </div>
                )}
                {viewMode === 'copilot' && (
                    <div className="flex h-full gap-3 animate-in fade-in duration-200">
                        <div className="w-3/5 h-full"><ChatInterface messages={chatMessages} onSendMessage={handleSendChatMessage} isLoading={isChatLoading} isInitialLoading={isInitialLoading} onApproveAction={handleApproveAction} onAiQuery={() => addEvent('AI Risk Assessment Requested', 'ai_assessment')} approvedActions={approvedActions} /></div>
                        <div className="w-2/5 h-full"><RecommendationPanel onApprove={handleApproveAction} approvedActions={approvedActions} /></div>
                    </div>
                )}
                {viewMode === 'dispatch' && (
                    <div className="flex h-full gap-3 animate-in fade-in duration-200">
                        <div className="w-3/5 h-full"><NotificationPanel activeJobId={activeJobId} /></div>
                        <div className="w-2/5 h-full"><AuditTimeline events={auditEvents} /></div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OperationalDashboard;
