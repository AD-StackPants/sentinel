import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface ChatMessage {
  role: string;
  text: string;
  recommendations?: string[];
}

interface ChatInterfaceProps {
    onApproveAction?: (action: string) => void;
    onAiQuery?: () => void;
    approvedActions?: string[];
    messages?: ChatMessage[];
    onSendMessage?: (query: string) => void;
    isLoading?: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  onApproveAction,
  onAiQuery,
  approvedActions = [],
  messages: externalMessages,
  onSendMessage: externalSendMessage,
  isLoading: externalIsLoading
}) => {
  const [internalMessages, setInternalMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [internalIsLoading, setInternalIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messages = externalMessages !== undefined ? externalMessages : internalMessages;
  const isLoading = externalIsLoading !== undefined ? externalIsLoading : internalIsLoading;

  const SUGGESTED_PROMPTS = [
    "What is the flood risk?",
    "What should we do?",
    "Notify affected residents"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (externalMessages !== undefined) return;

    const fetchHistory = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/v1/copilot/history?session_id=default_session`);
        if (Array.isArray(res.data) && res.data.length > 0) {
          const loadedMsgs = res.data.map((item: any) => {
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
          setInternalMessages(loadedMsgs);
        }
      } catch (err) {
        console.error("Failed to load chat history from Snowflake", err);
      }
    };
    fetchHistory();
  }, [externalMessages]);

  const sendQuery = async (queryText: string) => {
    if (!queryText.trim()) return;

    if (externalSendMessage) {
      externalSendMessage(queryText);
      setInput('');
      return;
    }

    if (onAiQuery) onAiQuery();

    setInternalMessages(prev => [...prev, { role: 'user', text: queryText }]);
    setInput('');
    setInternalIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/v1/copilot/ask`, {
        query: queryText,
        session_id: 'default_session'
      });

      const aiResponse = response.data;

      let fullText = aiResponse.response;
      if (aiResponse.explanation) {
        fullText += `\n\n**Reasoning**: ${aiResponse.explanation}`;
      }

      setInternalMessages(prev => [...prev, {
        role: 'ai',
        text: fullText,
        recommendations: aiResponse.recommended_actions
      }]);

    } catch (error) {
        console.error("Error asking copilot", error);
        setInternalMessages(prev => [...prev, { role: 'error', text: 'Connection to Sentinel AI backend failed.' }]);
    } finally {
        setInternalIsLoading(false);
    }
  };

  const handleSend = () => {
    sendQuery(input);
  };

  const handleLocalApprove = (action: string) => {
    setInternalMessages(prev => [...prev, { role: 'system', text: `Action requested: ${action}. Dispatching job...` }]);
    if (onApproveAction) {
        onApproveAction(action);
    }
  };

  return (
    <div className="card h-full flex flex-col p-3 gap-2 overflow-hidden border-border bg-card shadow-xs">
      {/* Subtle Compact Card Header */}
      <div className="flex justify-between items-center pb-1.5 border-b border-border/50 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
          <span className="font-semibold text-foreground text-xs uppercase tracking-wider">Copilot Intelligence</span>
        </div>
        <span className="text-[10px] font-mono text-neutral-foreground">CORTEX LLM</span>
      </div>

      {/* Messages Feed */}
      <div className="card-content flex-1 overflow-y-auto space-y-2.5 pr-1 text-xs">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-neutral-foreground px-4">
            <p className="font-medium text-foreground text-xs mb-1">Decision Support Agent</p>
            <p className="text-[11px] text-neutral-foreground mb-3">Ask about real-time risk, resource deployment, or public advisories.</p>

            {/* Suggested Prompts */}
            <div className="flex flex-wrap justify-center gap-1.5 w-full">
              {SUGGESTED_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => sendQuery(prompt)}
                  className="px-2 py-0.5 rounded bg-neutral/15 hover:bg-neutral/25 border border-border text-[11px] text-foreground font-medium transition-all"
                >
                  "{prompt}"
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`p-2.5 rounded-xl max-w-[88%] shadow-xs transition-all ${
            msg.role === 'user' 
              ? 'bg-primary/15 border border-primary/30 text-foreground ml-auto' 
              : msg.role === 'system' 
              ? 'bg-neutral/20 border border-border text-foreground font-mono text-[11px] w-full' 
              : 'bg-neutral/10 border border-border text-foreground'
          }`}>
            <div className="flex items-center gap-1.5 mb-1 text-[10px] font-semibold text-neutral-foreground">
              {msg.role === 'user' ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                  <span>Emergency Officer</span>
                </>
              ) : msg.role === 'system' ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
                  <span>System Log</span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-warning"></span>
                  <span className="text-warning font-bold">Sentinel AI</span>
                </>
              )}
            </div>

            <div className="whitespace-pre-wrap leading-relaxed text-xs">{msg.text}</div>

            {msg.recommendations && msg.recommendations.length > 0 && (
              <div className="mt-2 border-t border-border/70 pt-1.5">
                <strong className="text-[10px] uppercase font-bold text-neutral-foreground tracking-wider block mb-1">Directives:</strong>
                <div className="flex flex-wrap gap-1">
                  {msg.recommendations.map((rec, i) => {
                    const isApproved = approvedActions.includes(rec);
                    return isApproved ? (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-success/20 text-success border border-success/40 text-[10px] font-bold flex items-center gap-1"
                      >
                        ✓ {rec} (Approved)
                      </span>
                    ) : (
                      <button
                        key={i}
                        onClick={() => handleLocalApprove(rec)}
                        className="button button-primary button-sm text-[10px] font-semibold px-2 py-0.5 rounded"
                      >
                        {rec}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-neutral-foreground text-xs p-1">
            <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
            <span>Analyzing Cortex telemetry...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="pt-2 border-t border-border flex gap-1.5">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          className="form-input flex-1 text-xs px-2.5 py-1.5 rounded-lg bg-background border-border"
          placeholder="Ask operational prompt..."
        />
        <button
          onClick={handleSend}
          disabled={isLoading}
          className="button button-primary button-sm px-3 py-1.5 text-xs font-semibold"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;
