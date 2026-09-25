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
  isInitialLoading?: boolean;
}

const SUGGESTED_PROMPTS = [
  'What is the current flood risk?',
  'What actions should we take?',
  'Notify affected residents',
];

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  onApproveAction,
  onAiQuery,
  approvedActions = [],
  messages: externalMessages,
  onSendMessage: externalSendMessage,
  isLoading: externalIsLoading,
  isInitialLoading = false,
}) => {
  const [internalMessages, setInternalMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [internalIsLoading, setInternalIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messages = externalMessages !== undefined ? externalMessages : internalMessages;
  const isLoading = externalIsLoading !== undefined ? externalIsLoading : internalIsLoading;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (externalMessages !== undefined) return;
    const fetchHistory = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/v1/copilot/history?session_id=default_session`);
        if (Array.isArray(res.data) && res.data.length > 0) {
          setInternalMessages(res.data.map((item: any) => {
            let fullText = item.text || item.response || '';
            if (item.explanation) fullText += `\n\n**Reasoning**: ${item.explanation}`;
            return { role: item.sender === 'user' ? 'user' : 'ai', text: fullText, recommendations: item.recommended_actions || undefined };
          }));
        }
      } catch (err) { console.error('Failed to load chat history from Snowflake', err); }
    };
    fetchHistory();
  }, [externalMessages]);

  const sendQuery = async (queryText: string) => {
    if (!queryText.trim() || isInitialLoading) return;
    if (externalSendMessage) { externalSendMessage(queryText); setInput(''); return; }
    if (onAiQuery) onAiQuery();
    setInternalMessages(prev => [...prev, { role: 'user', text: queryText }]);
    setInput('');
    setInternalIsLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/v1/copilot/ask`, { query: queryText, session_id: 'default_session' });
      const ai = response.data;
      let fullText = ai.response;
      if (ai.explanation) fullText += `\n\n**Reasoning**: ${ai.explanation}`;
      setInternalMessages(prev => [...prev, { role: 'ai', text: fullText, recommendations: ai.recommended_actions }]);
    } catch (error) {
      console.error('Error asking copilot', error);
      setInternalMessages(prev => [...prev, { role: 'error', text: 'Connection to Sentinel AI backend failed.' }]);
    } finally {
      setInternalIsLoading(false);
    }
  };

  const handleLocalApprove = (action: string) => {
    setInternalMessages(prev => [...prev, { role: 'system', text: `Action requested: ${action}. Dispatching job...` }]);
    if (onApproveAction) onApproveAction(action);
  };

  return (
    <div className="h-full flex flex-col p-3 gap-2 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
      {/* Header */}
      <div className="flex justify-between items-center pb-1.5 border-b border-slate-100 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${isInitialLoading ? 'bg-amber-500 animate-ping' : 'bg-[#1976D2]'}`} aria-hidden="true"></span>
          <span className="font-semibold text-slate-900 dark:text-white text-xs uppercase tracking-wider">Copilot Intelligence</span>
        </div>
        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">{isInitialLoading ? 'Syncing DB...' : 'Cortex LLM'}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1" role="log" aria-label="Chat messages" aria-live="polite">
        {/* Skeleton */}
        {isInitialLoading && (
          <div className="flex flex-col gap-2.5 p-1 animate-pulse" aria-hidden="true">
            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1976D2] animate-ping"></span>
              Fetching transcript from Snowflake DB...
            </div>
            <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl w-3/4"></div>
            <div className="h-14 bg-blue-50 dark:bg-blue-950/30 rounded-xl w-4/5 ml-auto"></div>
            <div className="h-12 bg-slate-100 dark:bg-slate-800 rounded-xl w-2/3"></div>
          </div>
        )}

        {/* Empty state */}
        {!isInitialLoading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 gap-3">
            <div>
              <p className="font-semibold text-slate-900 dark:text-white text-xs mb-0.5">Decision Support Agent</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Ask about real-time risk, resource deployment, or public advisories.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-1.5">
              {SUGGESTED_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  id={`prompt-suggestion-${i}`}
                  onClick={() => sendQuery(prompt)}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-[11px] text-slate-700 dark:text-slate-300 font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1976D2] shadow-xs"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {!isInitialLoading && messages.map((msg, idx) => (
          <div
            key={idx}
            className={`p-2.5 rounded-xl max-w-[90%] shadow-xs text-xs ${
              msg.role === 'user'
                ? 'bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-slate-900 dark:text-white ml-auto'
                : msg.role === 'system'
                ? 'bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[11px] w-full max-w-full'
                : msg.role === 'error'
                ? 'bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-[#D32F2F] dark:text-rose-300 w-full max-w-full'
                : 'bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white'
            }`}
          >
            <div className="flex items-center gap-1.5 mb-1 text-[10px] font-semibold">
              {msg.role === 'user' ? (
                <><span className="w-1.5 h-1.5 rounded-full bg-[#1976D2]" aria-hidden="true"></span><span className="text-[#1976D2] dark:text-blue-300">Emergency Officer</span></>
              ) : msg.role === 'system' ? (
                <><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true"></span><span className="text-emerald-700 dark:text-emerald-300">System Log</span></>
              ) : msg.role === 'error' ? (
                <><span className="w-1.5 h-1.5 rounded-full bg-rose-500" aria-hidden="true"></span><span className="text-[#D32F2F] dark:text-rose-300 font-bold">Error</span></>
              ) : (
                <><span className="w-1.5 h-1.5 rounded-full bg-amber-500" aria-hidden="true"></span><span className="text-[#ED6C02] dark:text-amber-300 font-bold">Sentinel AI</span></>
              )}
            </div>
            <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>

            {msg.recommendations && msg.recommendations.length > 0 && (
              <div className="mt-2 border-t border-slate-200 dark:border-slate-700 pt-1.5">
                <strong className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider block mb-1">Directives:</strong>
                <div className="flex flex-wrap gap-1">
                  {msg.recommendations.map((rec, i) => {
                    const isApproved = approvedActions.includes(rec);
                    return isApproved ? (
                      <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold shadow-xs">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                        {rec}
                      </span>
                    ) : (
                      <button key={i} onClick={() => handleLocalApprove(rec)} className="px-2 py-0.5 rounded-md bg-[#1976D2] hover:bg-[#1565C0] active:bg-[#0D47A1] text-white text-[10px] font-semibold cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1976D2]">
                        {rec}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}

        {isLoading && !isInitialLoading && (
          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 px-1" role="status" aria-live="polite">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1976D2] animate-ping" aria-hidden="true"></span>
            <span>Analyzing Cortex telemetry...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex gap-1.5 shrink-0">
        <input
          id="copilot-input"
          type="text"
          value={input}
          disabled={isLoading || isInitialLoading}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendQuery(input)}
          className="flex-1 text-xs px-2.5 py-1.5 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#1976D2] transition-shadow"
          placeholder={isInitialLoading ? 'Connecting to Snowflake...' : 'Ask an operational prompt...'}
          aria-label="Chat input"
        />
        <button
          id="copilot-send-btn"
          onClick={() => sendQuery(input)}
          disabled={isLoading || isInitialLoading || !input.trim()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1976D2] hover:bg-[#1565C0] active:bg-[#0D47A1] text-white text-xs font-semibold cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1976D2] transition-colors"
          aria-label="Send message"
        >
          {isLoading
            ? <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          }
          <span className="hidden sm:inline">{isLoading ? '' : 'Send'}</span>
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;
