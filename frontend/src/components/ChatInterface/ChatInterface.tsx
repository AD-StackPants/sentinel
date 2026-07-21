import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<{role: string, text: string, recommendations?: string[]}[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/v1/copilot/ask`, {
        query: userMsg
      });

      const aiResponse = response.data;

      let fullText = aiResponse.response;
      if (aiResponse.explanation) {
        fullText += `\n\n**Reasoning**: ${aiResponse.explanation}`;
      }

      setMessages(prev => [...prev, {
        role: 'ai',
        text: fullText,
        recommendations: aiResponse.recommended_actions
      }]);

    } catch (error) {
        console.error("Error asking copilot", error);
        setMessages(prev => [...prev, { role: 'error', text: 'Connection to Sentinel AI backend failed.' }]);
    } finally {
        setIsLoading(false);
    }
  };

  const handleApproveAction = async (action: string) => {
    if (action.includes("Approve Notification Dispatch") || action.includes("Orange Alert")) {
         setMessages(prev => [...prev, { role: 'system', text: `Executing Action: ${action}... dispatching job...` }]);

         try {
             // Mock creating a job
             const jobRes = await axios.post(`${API_BASE_URL}/api/v1/jobs/`, {
                 messages: ["EMERGENCY: Proceed to evacuation centers immediately."],
                 channels: ["sms", "email"],
                 recipients_filter: "high_risk_zones"
             });

             const jobId = jobRes.data.job_id;
             setMessages(prev => [...prev, { role: 'system', text: `Job Executed. Job ID: ${jobId}. Fetching status...` }]);

             // Quick poll for demo purposes
             setTimeout(async () => {
                const statusRes = await axios.get(`${API_BASE_URL}/api/v1/jobs/${jobId}`);
                setMessages(prev => [...prev, {
                    role: 'system',
                    text: `Job Status: ${statusRes.data.status}.\nLogs:\n${statusRes.data.logs.join('\n')}`
                }]);
             }, 1500);

         } catch (e) {
             console.error("Failed to execute job", e);
         }
    } else {
        setMessages(prev => [...prev, { role: 'system', text: `Action logged: ${action}` }]);
    }
  }

  return (
    <div className="flex flex-col h-full border rounded shadow-sm bg-white">
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.length === 0 && (
            <div className="text-gray-400 text-center mt-10">
                Ask me about flood risks, resources, or dispatching alerts.
            </div>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className={`p-3 rounded-lg max-w-[85%] ${msg.role === 'user' ? 'bg-blue-50 ml-auto' : msg.role === 'system' ? 'bg-gray-800 text-green-400 text-xs font-mono mx-auto w-full' : 'bg-gray-50 border'}`}>
            <strong className="block mb-1 text-sm text-gray-500">
                {msg.role === 'user' ? 'You' : msg.role === 'system' ? 'System' : 'Sentinel AI'}
            </strong>
            <div className={`whitespace-pre-wrap ${msg.role === 'system' ? '' : 'text-gray-800'}`}>{msg.text}</div>

            {msg.recommendations && msg.recommendations.length > 0 && (
                <div className="mt-3 border-t pt-2">
                    <strong className="text-xs text-gray-500 block mb-2">Recommended Actions:</strong>
                    <div className="flex flex-wrap gap-2">
                        {msg.recommendations.map((rec, i) => (
                            <button
                                key={i}
                                onClick={() => handleApproveAction(rec)}
                                className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded"
                            >
                                {rec}
                            </button>
                        ))}
                    </div>
                </div>
            )}
          </div>
        ))}
        {isLoading && <div className="text-gray-400 text-sm">Sentinel AI is thinking...</div>}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-3 border-t bg-gray-50 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          className="flex-1 border border-gray-300 p-2 rounded focus:outline-none focus:border-blue-500"
          placeholder="Ask operational questions..."
        />
        <button
            onClick={handleSend}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors disabled:opacity-50"
        >
            Send
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;
