import React, { useState } from 'react';
import ChatInterface from '../ChatInterface/ChatInterface';
import DisasterMap from '../DisasterMap/DisasterMap';
import RecommendationPanel from '../RecommendationPanel/RecommendationPanel';
import NotificationPanel from '../NotificationPanel/NotificationPanel';
import AuditTimeline, { type AuditEvent } from '../AuditTimeline/AuditTimeline';
import axios from 'axios';

const OperationalDashboard: React.FC = () => {
    const [activeJobId, setActiveJobId] = useState<string | null>(null);
    const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([
        { timestamp: new Date(), event: 'System Initialized', type: 'system_execution' }
    ]);

    const addEvent = (event: string, type: AuditEvent['type']) => {
        setAuditEvents(prev => [...prev, { timestamp: new Date(), event, type }]);
    };

    const handleApproveAction = async (action: string) => {
        addEvent(`User Approved Action: ${action}`, 'user_approval');

        if (action.includes("Notification") || action.includes("Orange Alert")) {
            addEvent('Dispatching Notification Job to Execution Engine', 'system_execution');
            try {
                 const jobRes = await axios.post('http://localhost:8000/api/v1/jobs/', {
                     messages: ["EMERGENCY ADVISORY (ZAMBOANGA): Proceed to designated evacuation centers immediately. River levels are critical."],
                     channels: ["sms", "email"],
                     recipients_filter: "tumaga_stamaria_tetuan"
                 });
                 setActiveJobId(jobRes.data.job_id);
                 addEvent(`Job ${jobRes.data.job_id} Queued`, 'system_execution');
            } catch (e) {
                 console.error("Failed to execute job", e);
                 addEvent(`Job Dispatch Failed`, 'system_execution');
            }
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-100 p-4 gap-4 overflow-hidden">
            {/* Top Row: Map & Recommendations */}
            <div className="flex h-3/5 gap-4">
                <div className="w-2/3">
                    <DisasterMap />
                </div>
                <div className="w-1/3 flex flex-col gap-4">
                     <div className="h-full">
                        <RecommendationPanel onApprove={handleApproveAction} />
                     </div>
                </div>
            </div>

            {/* Bottom Row: Chat, Notifications, Audit */}
            <div className="flex h-2/5 gap-4">
                <div className="w-1/3">
                     <ChatInterface onApproveAction={handleApproveAction} onAiQuery={() => addEvent("AI Risk Assessment Requested", "ai_assessment")}/>
                </div>
                <div className="w-1/3">
                     <NotificationPanel activeJobId={activeJobId} />
                </div>
                 <div className="w-1/3">
                     <AuditTimeline events={auditEvents} />
                </div>
            </div>
        </div>
    );
};

export default OperationalDashboard;
