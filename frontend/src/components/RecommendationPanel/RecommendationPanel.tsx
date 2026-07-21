import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface Recommendations {
    risk_level: string;
    confidence_score: number;
    affected_population: number;
    affected_barangays: string[];
    recommended_actions: string[];
}

const RecommendationPanel: React.FC<{ onApprove: (action: string) => void }> = ({ onApprove }) => {
    const [recs, setRecs] = useState<Recommendations | null>(null);

    useEffect(() => {
        const fetchRecs = async () => {
            try {
                const res = await axios.get('http://localhost:8000/api/v1/copilot/recommendations');
                setRecs(res.data);
            } catch (e) {
                console.error("Failed to fetch recommendations", e);
            }
        };
        fetchRecs();
    }, []);

    if (!recs) return <div className="p-4 border rounded shadow bg-white">Loading Recommendations...</div>;

    return (
        <div className="p-4 border rounded shadow bg-white flex flex-col gap-4 h-full">
            <h2 className="font-bold text-lg border-b pb-2">Active Recommendations</h2>

            <div className="flex gap-4">
                <div className="flex-1 bg-red-100 p-3 rounded text-center border border-red-200">
                    <div className="text-red-700 font-bold">{recs.risk_level}</div>
                    <div className="text-xs text-red-600">{recs.confidence_score}% Confidence</div>
                </div>
                <div className="flex-1 bg-blue-100 p-3 rounded text-center border border-blue-200">
                    <div className="text-blue-700 font-bold">{recs.affected_population.toLocaleString()}</div>
                    <div className="text-xs text-blue-600">Affected Residents</div>
                </div>
            </div>

            <div>
                <strong className="text-sm text-gray-700">Affected Barangays:</strong>
                <p className="text-sm text-gray-600">{recs.affected_barangays.join(", ")}</p>
            </div>

            <div className="flex-1 overflow-y-auto">
                <strong className="text-sm text-gray-700 block mb-2">Recommended Actions:</strong>
                <div className="flex flex-col gap-2">
                    {recs.recommended_actions.map((action, idx) => (
                        <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 border rounded text-sm">
                            <span>{action}</span>
                            <button
                                onClick={() => onApprove(action)}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs transition-colors"
                            >
                                Approve
                            </button>
                        </div>
                    ))}
                    <div className="flex justify-between items-center p-2 bg-gray-50 border rounded text-sm">
                        <span>Dispatch Emergency Notifications</span>
                        <button
                            onClick={() => onApprove("Dispatch Notifications")}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs transition-colors"
                        >
                            Approve
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RecommendationPanel;
