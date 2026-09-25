import React, { useState, useEffect, useRef } from 'react';

const ChatIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);
const DirectiveIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
);
const DispatchIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
  </svg>
);
const AuditIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const STEPS = [
  { id: 'chat' as const,           label: 'Copilot Chat',    num: '1', icon: <ChatIcon />,      activeClass: 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/60 text-[#1976D2] dark:text-blue-300 shadow-xs' },
  { id: 'recommendation' as const, label: 'Directive AI',    num: '2', icon: <DirectiveIcon />, activeClass: 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/60 text-[#ED6C02] dark:text-amber-300 shadow-xs' },
  { id: 'dispatch' as const,       label: 'Dispatch Engine', num: '3', icon: <DispatchIcon />,  activeClass: 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/60 text-[#ED6C02] dark:text-amber-300 shadow-xs' },
  { id: 'success' as const,        label: 'Audit Success',   num: '4', icon: <AuditIcon />,     activeClass: 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 shadow-xs' },
];

export const EOCWorkflowSimulator: React.FC = () => {
  const [simState, setSimState] = useState<'idle' | 'chat' | 'recommendation' | 'dispatch' | 'success'>('idle');
  const [dispatchProgress, setDispatchProgress] = useState<number>(0);
  const [autoProgress, setAutoProgress] = useState<number>(0);
  const [isAutomating, setIsAutomating] = useState<boolean>(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval>[]>([]);

  const clearAllTimers = () => {
    timerRef.current.forEach(clearTimeout); timerRef.current = [];
    intervalRef.current.forEach(clearInterval); intervalRef.current = [];
  };

  useEffect(() => () => clearAllTimers(), []);

  const runAutomatedSimulation = () => {
    clearAllTimers();
    setIsAutomating(true); setSimState('chat'); setAutoProgress(15); setDispatchProgress(0);
    const t1 = setTimeout(() => { setSimState('recommendation'); setAutoProgress(45); }, 3200);
    timerRef.current.push(t1);
    const t2 = setTimeout(() => {
      setSimState('dispatch'); setAutoProgress(75); setDispatchProgress(0);
      let c = 0;
      const interval = setInterval(() => { c += 20; setDispatchProgress(c); if (c >= 100) clearInterval(interval); }, 200);
      intervalRef.current.push(interval);
    }, 6400);
    timerRef.current.push(t2);
    const t3 = setTimeout(() => { setSimState('success'); setAutoProgress(100); setIsAutomating(false); }, 9600);
    timerRef.current.push(t3);
  };

  const handleManualTabClick = (step: 'chat' | 'recommendation' | 'dispatch' | 'success') => {
    clearAllTimers(); setIsAutomating(false); setSimState(step);
    if (step === 'chat') setAutoProgress(25);
    if (step === 'recommendation') setAutoProgress(50);
    if (step === 'dispatch') { setAutoProgress(75); setDispatchProgress(100); }
    if (step === 'success') setAutoProgress(100);
  };

  // Shared button classes
  const btnPrimary = 'inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1976D2] hover:bg-[#1565C0] active:bg-[#0D47A1] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1976D2] focus-visible:ring-offset-2';
  const btnSecondary = 'inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1976D2]';

  return (
    <section className="space-y-6 select-none" aria-labelledby="simulator-heading">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-[10px] font-mono font-bold text-[#1976D2] tracking-widest uppercase mb-1">Live Interactive Simulator</div>
          <h2 id="simulator-heading" className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">End-to-End EOC Operations Simulation</h2>
        </div>
        {simState === 'idle' ? (
          <button id="start-simulation-btn" onClick={runAutomatedSimulation} className={btnPrimary}>
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            Start EOC Automation
          </button>
        ) : (
          <button id="restart-simulation-btn" onClick={runAutomatedSimulation} disabled={isAutomating} className={btnSecondary}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            {isAutomating ? 'Automating Workflow...' : 'Restart Simulation'}
          </button>
        )}
      </div>

      {/* Progress bar */}
      {isAutomating && (
        <div className="space-y-1.5 font-mono text-[10px]" role="status" aria-live="polite">
          <div className="flex justify-between items-center text-[#1976D2] dark:text-blue-300 font-bold">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1976D2] animate-ping" aria-hidden="true"></span>
              Automated Workflow Executing...
            </span>
            <span className="tabular-nums">{autoProgress}% Completed</span>
          </div>
          <div className="w-full h-1.5 rounded-sm bg-slate-200 dark:bg-slate-700 overflow-hidden" role="progressbar" aria-valuenow={autoProgress} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full bg-[#1976D2] transition-all duration-300 rounded-sm" style={{ width: `${autoProgress}%` }}></div>
          </div>
        </div>
      )}

      {/* Stepper tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5" role="tablist" aria-label="Simulation steps">
        {STEPS.map((step) => {
          const isActive = simState === step.id;
          return (
            <button
              key={step.id}
              id={`sim-step-${step.id}`}
              role="tab"
              aria-selected={isActive}
              onClick={() => handleManualTabClick(step.id)}
              className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-colors text-xs font-mono font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1976D2] ${
                isActive
                  ? step.activeClass
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <span className="w-5 h-5 rounded-md bg-current/10 flex items-center justify-center text-[10px] font-bold flex-shrink-0">{step.num}</span>
              <span className="flex items-center gap-1.5 truncate">{step.icon}<span className="truncate">{step.label}</span></span>
            </button>
          );
        })}
      </div>

      {/* Simulation card */}
      <div className="p-6 lg:p-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs min-h-72 flex flex-col justify-between" role="tabpanel">

        {/* IDLE */}
        {simState === 'idle' && (
          <div className="my-auto text-center space-y-5 py-6">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-[#1976D2] dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="space-y-2 max-w-lg mx-auto">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Interactive EOC Simulation Ready</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Experience the full automated cycle: live Copilot prompt evaluation, grounded Cortex RAG reasoning, commander directive guardrails, and multi-channel broadcast dispatch with audit logging.
              </p>
            </div>
            <button id="run-simulation-center-btn" onClick={runAutomatedSimulation} className={btnPrimary + ' mx-auto'}>
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              Run Automated Simulation Flow
            </button>
          </div>
        )}

        {/* STEP 1: COPILOT CHAT */}
        {simState === 'chat' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#1976D2] dark:text-blue-300">
                <span className="w-2 h-2 rounded-full bg-[#1976D2] animate-ping" aria-hidden="true"></span>
                Step 1: Copilot Conversational Reasoning
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-[#1976D2] dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[10px] font-mono font-bold uppercase tracking-wider shadow-xs">
                Cortex Search + AI Complete
              </span>
            </div>

            <div className="space-y-3 max-w-3xl text-xs">
              <div className="flex justify-end">
                <div className="bg-[#1976D2] text-white px-4 py-2.5 rounded-xl rounded-tr-sm max-w-lg shadow-xs">
                  <strong>Commander:</strong> Which areas are at greatest flood risk and what should we do?
                </div>
              </div>
              <div className="flex justify-start">
                <div className="bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-xl rounded-tl-sm max-w-xl space-y-2 shadow-xs">
                  <div className="flex items-center justify-between font-mono text-[10px] text-[#1976D2] dark:text-blue-300 font-bold mb-1">
                    <span>Sentinel AI Copilot</span>
                    {isAutomating && <span className="text-[#ED6C02] dark:text-amber-300 text-[9px] animate-pulse">Reasoning over SOP vectors...</span>}
                  </div>
                  <p className="leading-relaxed text-slate-900 dark:text-white">
                    According to live river telemetry and official SOPs, <strong>Tumaga River Sensor (ZAM-TUMAGA-01)</strong> has reached <strong>8.80 meters</strong> (exceeding 8.0 m critical threshold).
                  </p>
                  <p className="leading-relaxed text-slate-500 dark:text-slate-400">
                    Low-lying barangays <strong className="text-slate-700 dark:text-slate-200">Tumaga, Sta. Maria, and Tetuan</strong> face immediate inundation risk. Estimated <strong className="font-mono text-slate-700 dark:text-slate-200">28,000</strong> residents require evacuation support.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center text-xs font-mono border-t border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 italic text-[11px]">{isAutomating ? 'Processing... Advancing to Step 2 automatically.' : 'Select the next step above or below:'}</span>
              <button id="proceed-to-directives-btn" onClick={() => handleManualTabClick('recommendation')} className={btnPrimary}>
                Proceed to Directives
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: DIRECTIVE RECOMMENDATIONS */}
        {simState === 'recommendation' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#ED6C02] dark:text-amber-300">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" aria-hidden="true"></span>
                Step 2: Human-in-the-Loop Directive Approval
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/60 text-[#D32F2F] dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-[10px] font-mono font-bold uppercase tracking-wider shadow-xs">Red Alert · 96% Confidence</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
              {[
                { color: 'text-[#1976D2] dark:text-blue-300', label: '1. Rescue Assets', desc: 'Deploy 8 swift-water rescue teams & 4 ambulances to Tumaga.' },
                { color: 'text-[#ED6C02] dark:text-amber-300', label: '2. Evacuation Shelters', desc: 'Open City Coliseum & Sta. Maria gymnasium shelters.' },
                { color: 'text-emerald-700 dark:text-emerald-300', label: '3. Public Broadcast', desc: 'Queue 1,200 Emergency SMS & Email advisories to residents.' },
              ].map((item) => (
                <div key={item.label} className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 space-y-1.5 shadow-xs">
                  <div className={`font-bold text-[11px] ${item.color}`}>{item.label}</div>
                  <div className="text-slate-700 dark:text-slate-300 leading-relaxed">{item.desc}</div>
                </div>
              ))}
            </div>

            <div className="p-3.5 rounded-lg bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <svg className="w-4 h-4 text-[#1976D2] dark:text-blue-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
                <span><strong className="text-slate-900 dark:text-white">Commander Guardrail Active:</strong> Mandatory sign-off required prior to broadcast.</span>
              </div>
              <button id="approve-dispatch-btn" onClick={() => { clearAllTimers(); setSimState('dispatch'); setDispatchProgress(100); }} className={btnPrimary}>
                Approve &amp; Dispatch Alerts
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: DISPATCH ENGINE */}
        {simState === 'dispatch' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#ED6C02] dark:text-amber-300">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" aria-hidden="true"></span>
                Step 3: Multi-Channel Broadcast Dispatching...
              </div>
              <span className="font-mono text-xs font-bold text-[#ED6C02] dark:text-amber-300 tabular-nums">{dispatchProgress}% Completed</span>
            </div>
            <div className="space-y-4 font-mono text-xs">
              <div className="w-full h-2 rounded-sm bg-slate-200 dark:bg-slate-700 overflow-hidden" role="progressbar" aria-valuenow={dispatchProgress} aria-valuemin={0} aria-valuemax={100}>
                <div className="h-full bg-emerald-500 transition-all duration-200 rounded-sm" style={{ width: `${dispatchProgress}%` }}></div>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 space-y-1.5 shadow-xs">
                <div className="text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider mb-1">WebSocket Log Stream</div>
                <div className="text-slate-700 dark:text-slate-300">[NOTIFICATION ENGINE] Dispatching SMS Batch 1 to 1,200 registered citizen phones in Tumaga...</div>
                <div className="text-emerald-600 dark:text-emerald-400">[TWILIO RELAY] 850 SMS Messages Delivered (HTTP 200 OK)</div>
                <div className="text-emerald-600 dark:text-emerald-400">[SMTP RELAY] 350 Evacuation Email Advisories Delivered</div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: SUCCESS */}
        {simState === 'success' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-emerald-700 dark:text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true"></span>
                Step 4: Dispatch Successful &amp; Audited
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-mono font-bold uppercase tracking-wider shadow-xs">100% Delivered</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
              {[
                { label: 'SMS Delivered',       value: '1,200 / 1,200', color: 'text-emerald-700 dark:text-emerald-300' },
                { label: 'Emails Delivered',    value: '350 / 350',     color: 'text-emerald-700 dark:text-emerald-300' },
                { label: 'Snowflake Audit Log', value: 'PUBLIC.audit_logs', color: 'text-[#1976D2] dark:text-blue-300' },
              ].map((item) => (
                <div key={item.label} className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 space-y-1 text-center shadow-xs">
                  <div className="text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider">{item.label}</div>
                  <div className={`font-black text-xl font-mono tabular-nums ${item.color}`}>{item.value}</div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-between items-center border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400">Simulation complete. Every action has been logged to Snowflake DB.</span>
              <button id="replay-simulation-btn" onClick={runAutomatedSimulation} className={btnSecondary}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                Replay Automation
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
