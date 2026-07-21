import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface NotificationPanelProps {
    activeJobId: string | null;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ activeJobId }) => {
    const [status, setStatus] = useState<string>('idle');
    const [logs, setLogs] = useState<string[]>([]);
    const [counts, setCounts] = useState<{sms?: number, email?: number}>({});

    useEffect(() => {
        if (!activeJobId) return;

        setStatus('polling');

        const interval = setInterval(async () => {
            try {
                const res = await axios.get(`http://localhost:8000/api/v1/jobs/${activeJobId}`);
                setStatus(res.data.status);
                setLogs(res.data.logs);
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
        }, 1000);

        return () => clearInterval(interval);
    }, [activeJobId]);

    return (
        <div className="p-4 border rounded shadow bg-gray-900 text-white h-full flex flex-col font-mono">
            <h2 className="font-bold text-lg border-b border-gray-700 pb-2 mb-4 text-green-400">Notification Execution Logs</h2>

            <div className="flex justify-between mb-4 text-sm">
                <div>Status: <span className={status === 'completed' ? 'text-green-400' : 'text-yellow-400'}>{status.toUpperCase()}</span></div>
                {activeJobId && <div className="text-gray-400">Job ID: {activeJobId.substring(0,8)}...</div>}
            </div>

            <div className="flex flex-col gap-4 mb-4 text-sm">
                <div className="bg-gray-800 p-3 rounded text-center border border-gray-700">
                    <div className="flex justify-between mb-1">
                        <span className="text-gray-400 font-semibold text-xs">SMS Dispatch Progress</span>
                        <span className="text-blue-400 font-semibold text-xs">{counts.sms || 0} / 1200</span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-2.5">
                        <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${((counts.sms || 0) / 1200) * 100}%` }}></div>
                    </div>
                </div>
                <div className="bg-gray-800 p-3 rounded text-center border border-gray-700">
                    <div className="flex justify-between mb-1">
                        <span className="text-gray-400 font-semibold text-xs">Email Dispatch Progress</span>
                        <span className="text-blue-400 font-semibold text-xs">{counts.email || 0} / 3500</span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-2.5">
                        <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${((counts.email || 0) / 3500) * 100}%` }}></div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-black p-3 rounded border border-gray-800 text-xs text-gray-300">
                {logs.length === 0 ? (
                    <div className="text-gray-600">Waiting for job execution...</div>
                ) : (
                    logs.map((log, idx) => (
                        <div key={idx} className="mb-1">
                            <span className="text-green-500 mr-2">{'>'}</span>{log}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default NotificationPanel;
