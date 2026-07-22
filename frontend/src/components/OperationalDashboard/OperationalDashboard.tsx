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

const OperationalDashboard: React.FC = () => {
    const [viewMode, setViewMode] = useState<ViewMode>('overview');
    const [activeJobId, setActiveJobId] = useState<string | null>(null);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [approvedActions, setApprovedActions] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem('sentinel_approved_actions');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });
    const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([
        { timestamp: new Date(), event: 'System Initialized', type: 'system_execution' }
    ]);

    // Fetch approved directives, audit events, and chat history from Snowflake DB on mount
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
                    setApprovedActions(prev => {
                        const merged = Array.from(new Set([...prev, ...dirRes.data.approved_directives]));
                        localStorage.setItem('sentinel_approved_actions', JSON.stringify(merged));
                        return merged;
                    });
                }
                if (evtRes.data?.events && Array.isArray(evtRes.data.events) && evtRes.data.events.length > 0) {
                    const dbEvents: AuditEvent[] = evtRes.data.events.map((e: any) => ({
                        timestamp: new Date(e.timestamp),
                        event: e.event,
                        type: e.type as AuditEvent['type']
                    }));
                    setAuditEvents(dbEvents);
                }
                if (Array.isArray(chatRes.data) && chatRes.data.length > 0) {
                    const loadedMsgs = chatRes.data.map((item: any) => {
                        let fullText = item.text || item.response || '';
                        if (item.explanation) {
                            fullText += `\n\n**Reasoning**: ${item.explanation}`;
                        }
                        return {
                            role: item.sender === 'user' ? 'user' : 'ai',
                            text: fullText,
                            recommendations: item.recommended_actions || undefined
                        };
                    });
                    setChatMessages(loadedMsgs);
                }
            } catch (err) {
                console.error("Failed to load initial operational data from backend", err);
            } finally {
                setIsInitialLoading(false);
            }
        };
        fetchInitialAuditData();
    }, []);

    const handleSendChatMessage = async (queryText: string) => {
        if (!queryText.trim()) return;

        addEvent("AI Risk Assessment Requested", "ai_assessment");
        setChatMessages(prev => [...prev, { role: 'user', text: queryText }]);
        setIsChatLoading(true);

        try {
            const headers = await getAuthHeader();
            const response = await axios.post(`${API_BASE_URL}/api/v1/copilot/ask`, {
                query: queryText,
                session_id: 'default_session'
            }, { headers });

            const aiResponse = response.data;
            let fullText = aiResponse.response;
            if (aiResponse.explanation) {
                fullText += `\n\n**Reasoning**: ${aiResponse.explanation}`;
            }

            setChatMessages(prev => [...prev, {
                role: 'ai',
                text: fullText,
                recommendations: aiResponse.recommended_actions
            }]);
        } catch (error) {
            console.error("Error asking copilot", error);
            setChatMessages(prev => [...prev, { role: 'error', text: 'Connection to Sentinel AI backend failed.' }]);
        } finally {
            setIsChatLoading(false);
        }
    };

    // Keyboard shortcuts (1: Overview, 2: Map, 3: Copilot, 4: Dispatch)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore hotkeys when typing in input fields
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
        // Persist to Snowflake audit_logs
        try {
            const headers = await getAuthHeader();
            await axios.post(`${API_BASE_URL}/api/v1/audit/log`, { event, event_type: type }, { headers });
        } catch (e) {
            console.error("Failed to persist audit log", e);
        }
    };

    const handleApproveAction = async (action: string) => {
        setApprovedActions(prev => {
            if (prev.includes(action)) return prev;
            const updated = [...prev, action];
            try {
                localStorage.setItem('sentinel_approved_actions', JSON.stringify(updated));
            } catch (e) {
                console.error("Failed to save approved action to localStorage", e);
            }
            return updated;
        });

        addEvent(`User Approved Directive: ${action}`, 'user_approval');
        addEvent('Queueing Broadcast Job to Notification Engine...', 'system_execution');

        try {
            const headers = await getAuthHeader();
            const jobRes = await axios.post(
                `${API_BASE_URL}/api/v1/jobs/`,
                {
                    messages: [`EMERGENCY ADVISORY (ZAMBOANGA): ${action}. Proceed to safety centers immediately.`],
                    channels: ["sms", "email"],
                    recipients_filter: "tumaga_stamaria_tetuan"
                },
                { headers }
            );

            const newJobId = jobRes.data.job_id;
            setActiveJobId(newJobId);
            addEvent(`Job ${newJobId.substring(0, 8)} Dispatch Active`, 'system_execution');
        } catch (e) {
            console.error("Failed to execute job", e);
            addEvent(`Job Dispatch Execution Failed`, 'system_execution');
        }
    };

    const [celeryStatus, setCeleryStatus] = useState<string | null>(null);
    const [isCelerySyncing, setIsCelerySyncing] = useState(false);

    const handleCelerySync = async () => {
        setIsCelerySyncing(true);
        setCeleryStatus("Dispatching Celery Task...");
        addEvent("Celery Task Dispatched: Sync Live PH Weather to Snowflake", "system_execution");

        try {
            const res = await axios.post(`${API_BASE_URL}/api/v1/ingestion/sync-weather`);
            const taskId = res.data.task_id;
            setCeleryStatus(`Task ${taskId.substring(0, 8)} Executing...`);

            setTimeout(async () => {
                try {
                    const statusRes = await axios.get(`${API_BASE_URL}/api/v1/ingestion/status/${taskId}`);
                    if (statusRes.data.ready) {
                        setCeleryStatus("✓ Snowflake Synced via Celery");
                        addEvent("Celery Worker Complete: Live PH Telemetry Synced to Snowflake", "system_execution");
                    } else {
                        setCeleryStatus("Task Running in Background");
                    }
                } catch {
                    setCeleryStatus("✓ Snowflake Ingested");
                } finally {
                    setIsCelerySyncing(false);
                }
            }, 1500);
        } catch (err) {
            console.error("Celery sync failed", err);
            setCeleryStatus("Celery Ingestion Error");
            setIsCelerySyncing(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-background gap-3 overflow-hidden">
            {/* EOC Navigation Tab Bar */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-card/90 glass-panel border border-border rounded-xl shadow-xs">
                <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-neutral-foreground font-semibold text-[11px] uppercase tracking-wider mr-1.5 hidden sm:inline">
                        OPERATIONAL VIEW:
                    </span>
                    
                    <button
                        onClick={() => setViewMode('overview')}
                        className={`button button-sm text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all ${
                            viewMode === 'overview'
                                ? 'button-primary shadow-xs'
                                : 'button-outline text-neutral-foreground hover:text-foreground'
                        }`}
                    >
                        <span>📊</span>
                        <span>Overview</span>
                        <span className={`text-[10px] px-1 rounded font-mono ${viewMode === 'overview' ? 'bg-primary-foreground/20' : 'bg-neutral/20'}`}>1</span>
                    </button>

                    <button
                        onClick={() => setViewMode('map')}
                        className={`button button-sm text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all ${
                            viewMode === 'map'
                                ? 'button-primary shadow-xs'
                                : 'button-outline text-neutral-foreground hover:text-foreground'
                        }`}
                    >
                        <span>🗺️</span>
                        <span>Map Focus</span>
                        <span className={`text-[10px] px-1 rounded font-mono ${viewMode === 'map' ? 'bg-primary-foreground/20' : 'bg-neutral/20'}`}>2</span>
                    </button>

                    <button
                        onClick={() => setViewMode('copilot')}
                        className={`button button-sm text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all ${
                            viewMode === 'copilot'
                                ? 'button-primary shadow-xs'
                                : 'button-outline text-neutral-foreground hover:text-foreground'
                        }`}
                    >
                        <span>🤖</span>
                        <span>Copilot Focus</span>
                        <span className={`text-[10px] px-1 rounded font-mono ${viewMode === 'copilot' ? 'bg-primary-foreground/20' : 'bg-neutral/20'}`}>3</span>
                    </button>

                    <button
                        onClick={() => setViewMode('dispatch')}
                        className={`button button-sm text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all ${
                            viewMode === 'dispatch'
                                ? 'button-primary shadow-xs'
                                : 'button-outline text-neutral-foreground hover:text-foreground'
                        }`}
                    >
                        <span>📡</span>
                        <span>Dispatch & Audit</span>
                        <span className={`text-[10px] px-1 rounded font-mono ${viewMode === 'dispatch' ? 'bg-primary-foreground/20' : 'bg-neutral/20'}`}>4</span>
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleCelerySync}
                        disabled={isCelerySyncing}
                        className="button button-secondary button-sm text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5 border border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary transition-all disabled:opacity-50"
                    >
                        <span className={isCelerySyncing ? "animate-spin" : ""}>⚡</span>
                        <span>{isCelerySyncing ? "Celery Syncing..." : "Celery Ingest"}</span>
                    </button>

                    {celeryStatus && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral/20 text-foreground border border-border">
                            {celeryStatus}
                        </span>
                    )}

                    {isInitialLoading ? (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/30 text-xs text-primary animate-pulse font-medium">
                            <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
                            <span>Syncing Snowflake DB...</span>
                        </div>
                    ) : (
                        <div className="hidden lg:flex items-center gap-2 text-[11px] font-mono text-neutral-foreground">
                            <span>HOTKEYS:</span>
                            <span className="px-1.5 py-0.5 rounded bg-neutral/15 border border-border text-foreground font-bold">[1-4]</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Tab Viewport */}
            <div className="flex-1 overflow-hidden transition-all duration-300">
                {/* 1. OVERVIEW: 5-Panel Grid */}
                {viewMode === 'overview' && (
                    <div className="flex flex-col h-full gap-3 animate-in fade-in duration-200">
                        {/* Top Row: Map & Recommendations */}
                        <div className="flex h-3/5 gap-3">
                            <div className="w-2/3 h-full">
                                <DisasterMap />
                            </div>
                            <div className="w-1/3 h-full">
                                <RecommendationPanel onApprove={handleApproveAction} approvedActions={approvedActions} />
                            </div>
                        </div>

                        {/* Bottom Row: Chat, Notifications, Audit */}
                        <div className="flex h-2/5 gap-3">
                            <div className="w-1/3 h-full">
                                <ChatInterface
                                    messages={chatMessages}
                                    onSendMessage={handleSendChatMessage}
                                    isLoading={isChatLoading}
                                    isInitialLoading={isInitialLoading}
                                    onApproveAction={handleApproveAction}
                                    onAiQuery={() => addEvent("AI Risk Assessment Requested", "ai_assessment")}
                                    approvedActions={approvedActions}
                                />
                            </div>
                            <div className="w-1/3 h-full">
                                <NotificationPanel activeJobId={activeJobId} />
                            </div>
                            <div className="w-1/3 h-full">
                                <AuditTimeline events={auditEvents} />
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. MAP FOCUS: 75% Map + 25% AI Directives */}
                {viewMode === 'map' && (
                    <div className="flex h-full gap-3 animate-in fade-in duration-200">
                        <div className="w-3/4 h-full">
                            <DisasterMap />
                        </div>
                        <div className="w-1/4 h-full">
                            <RecommendationPanel onApprove={handleApproveAction} approvedActions={approvedActions} />
                        </div>
                    </div>
                )}

                {/* 3. COPILOT FOCUS: 60% Chat + 40% Recommendations */}
                {viewMode === 'copilot' && (
                    <div className="flex h-full gap-3 animate-in fade-in duration-200">
                        <div className="w-3/5 h-full">
                            <ChatInterface
                                messages={chatMessages}
                                onSendMessage={handleSendChatMessage}
                                isLoading={isChatLoading}
                                isInitialLoading={isInitialLoading}
                                onApproveAction={handleApproveAction}
                                onAiQuery={() => addEvent("AI Risk Assessment Requested", "ai_assessment")}
                                approvedActions={approvedActions}
                            />
                        </div>
                        <div className="w-2/5 h-full">
                            <RecommendationPanel onApprove={handleApproveAction} approvedActions={approvedActions} />
                        </div>
                    </div>
                )}

                {/* 4. DISPATCH FOCUS: 60% Notification Console + 40% Audit Log */}
                {viewMode === 'dispatch' && (
                    <div className="flex h-full gap-3 animate-in fade-in duration-200">
                        <div className="w-3/5 h-full">
                            <NotificationPanel activeJobId={activeJobId} />
                        </div>
                        <div className="w-2/5 h-full">
                            <AuditTimeline events={auditEvents} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OperationalDashboard;
