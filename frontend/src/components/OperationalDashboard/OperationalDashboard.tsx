import React, { useState, useEffect } from 'react';
import ChatInterface from '../ChatInterface/ChatInterface';
import DisasterMap from '../DisasterMap/DisasterMap';
import RecommendationPanel from '../RecommendationPanel/RecommendationPanel';
import NotificationPanel from '../NotificationPanel/NotificationPanel';
import AuditTimeline, { type AuditEvent } from '../AuditTimeline/AuditTimeline';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

type ViewMode = 'overview' | 'map' | 'copilot' | 'dispatch';

const OperationalDashboard: React.FC = () => {
    const [viewMode, setViewMode] = useState<ViewMode>('overview');
    const [activeJobId, setActiveJobId] = useState<string | null>(null);
    const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([
        { timestamp: new Date(), event: 'System Initialized', type: 'system_execution' }
    ]);

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

    const addEvent = (event: string, type: AuditEvent['type']) => {
        setAuditEvents(prev => [...prev, { timestamp: new Date(), event, type }]);
    };

    const handleApproveAction = async (action: string) => {
        addEvent(`User Approved Directive: ${action}`, 'user_approval');
        addEvent('Queueing Broadcast Job to Notification Engine...', 'system_execution');

        try {
            const jobRes = await axios.post(`${API_BASE_URL}/api/v1/jobs/`, {
                messages: [`EMERGENCY ADVISORY (ZAMBOANGA): ${action}. Proceed to safety centers immediately.`],
                channels: ["sms", "email"],
                recipients_filter: "tumaga_stamaria_tetuan"
            });
            
            const newJobId = jobRes.data.job_id;
            setActiveJobId(newJobId);
            addEvent(`Job ${newJobId.substring(0, 8)} Dispatch Active`, 'system_execution');
        } catch (e) {
            console.error("Failed to execute job", e);
            addEvent(`Job Dispatch Execution Failed`, 'system_execution');
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

                <div className="hidden lg:flex items-center gap-2 text-[11px] font-mono text-neutral-foreground">
                    <span>HOTKEYS:</span>
                    <span className="px-1.5 py-0.5 rounded bg-neutral/15 border border-border text-foreground font-bold">[1-4]</span>
                    <span>SWITCH TABS</span>
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
                                <RecommendationPanel onApprove={handleApproveAction} />
                            </div>
                        </div>

                        {/* Bottom Row: Chat, Notifications, Audit */}
                        <div className="flex h-2/5 gap-3">
                            <div className="w-1/3 h-full">
                                <ChatInterface onApproveAction={handleApproveAction} onAiQuery={() => addEvent("AI Risk Assessment Requested", "ai_assessment")}/>
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
                            <RecommendationPanel onApprove={handleApproveAction} />
                        </div>
                    </div>
                )}

                {/* 3. COPILOT FOCUS: 60% Chat + 40% Recommendations */}
                {viewMode === 'copilot' && (
                    <div className="flex h-full gap-3 animate-in fade-in duration-200">
                        <div className="w-3/5 h-full">
                            <ChatInterface onApproveAction={handleApproveAction} onAiQuery={() => addEvent("AI Risk Assessment Requested", "ai_assessment")}/>
                        </div>
                        <div className="w-2/5 h-full">
                            <RecommendationPanel onApprove={handleApproveAction} />
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
