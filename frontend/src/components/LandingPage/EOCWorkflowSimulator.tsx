import React, { useState, useEffect, useRef } from 'react';

export const EOCWorkflowSimulator: React.FC = () => {
  // Simulator State: 'idle' | 'chat' | 'recommendation' | 'dispatch' | 'success'
  const [simState, setSimState] = useState<'idle' | 'chat' | 'recommendation' | 'dispatch' | 'success'>('idle');
  const [dispatchProgress, setDispatchProgress] = useState<number>(0);
  const [autoProgress, setAutoProgress] = useState<number>(0);
  const [isAutomating, setIsAutomating] = useState<boolean>(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval>[]>([]);

  const clearAllTimers = () => {
    timerRef.current.forEach(clearTimeout);
    timerRef.current = [];
    intervalRef.current.forEach(clearInterval);
    intervalRef.current = [];
  };

  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, []);

  const runAutomatedSimulation = () => {
    clearAllTimers();

    setIsAutomating(true);
    setSimState('chat');
    setAutoProgress(15);
    setDispatchProgress(0);

    // Step 1 -> Step 2 after 3 seconds
    const t1 = setTimeout(() => {
      setSimState('recommendation');
      setAutoProgress(45);
    }, 3200);
    timerRef.current.push(t1);

    // Step 2 -> Step 3 after 6.2 seconds
    const t2 = setTimeout(() => {
      setSimState('dispatch');
      setAutoProgress(75);
      setDispatchProgress(0);
      let current = 0;
      const interval = setInterval(() => {
        current += 20;
        setDispatchProgress(current);
        if (current >= 100) {
          clearInterval(interval);
        }
      }, 200);
      intervalRef.current.push(interval);
    }, 6400);
    timerRef.current.push(t2);

    // Step 3 -> Step 4 after 9.5 seconds
    const t3 = setTimeout(() => {
      setSimState('success');
      setAutoProgress(100);
      setIsAutomating(false);
    }, 9600);
    timerRef.current.push(t3);
  };

  const handleManualTabClick = (step: 'chat' | 'recommendation' | 'dispatch' | 'success') => {
    clearAllTimers();
    setIsAutomating(false);
    setSimState(step);
    if (step === 'chat') setAutoProgress(25);
    if (step === 'recommendation') setAutoProgress(50);
    if (step === 'dispatch') {
      setAutoProgress(75);
      setDispatchProgress(100);
    }
    if (step === 'success') setAutoProgress(100);
  };

  return (
    <section className="space-y-6 select-none">
      <div className="border-b border-border pb-3 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono font-bold text-primary tracking-widest uppercase">
            LIVE INTERACTIVE SIMULATOR
          </div>
          <h2 className="text-2xl font-black tracking-tight text-foreground">
            End-to-End EOC Operations Simulation
          </h2>
        </div>

        {simState === 'idle' ? (
          <button
            onClick={runAutomatedSimulation}
            className="button button-primary py-3.5 px-7 rounded-2xl font-bold text-xs shadow-xl flex items-center gap-2.5 animate-pulse cursor-pointer"
          >
            <span>START EOC AUTOMATION ▶</span>
          </button>
        ) : (
          <button
            onClick={runAutomatedSimulation}
            disabled={isAutomating}
            className="button button-outline py-2.5 px-5 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span>{isAutomating ? 'AUTOMATING WORKFLOW...' : 'RESTART SIMULATION 🔄'}</span>
          </button>
        )}
      </div>

      {/* GLOBAL AUTOMATION PROGRESS BAR */}
      {isAutomating && (
        <div className="space-y-1.5 font-mono text-[10px]">
          <div className="flex justify-between items-center text-primary font-bold">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
              AUTOMATED WORKFLOW EXECUTING...
            </span>
            <span>{autoProgress}% COMPLETED</span>
          </div>
          <div className="w-full h-2 rounded-full bg-background border border-primary/30 overflow-hidden shadow-inner">
            <div
              className="h-full bg-linear-to-r from-primary via-blue-400 to-cyan-400 transition-all duration-300 rounded-full shadow-md shadow-primary/50"
              style={{ width: `${autoProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* SIMULATION PIPELINE STEPPER BAR */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
        <div
          onClick={() => handleManualTabClick('chat')}
          className={`p-3.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
            simState === 'chat'
              ? 'border-primary bg-primary/20 text-primary font-bold shadow-lg ring-2 ring-primary/60 scale-[1.02]'
              : 'border-border bg-card text-neutral-foreground hover:text-foreground'
          }`}
        >
          <span className="w-6 h-6 rounded-full bg-primary/30 flex items-center justify-center text-[10px] font-bold">1</span>
          <span className="truncate">💬 1. COPILOT CHAT</span>
        </div>

        <div
          onClick={() => handleManualTabClick('recommendation')}
          className={`p-3.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
            simState === 'recommendation'
              ? 'border-warning bg-warning/20 text-warning font-bold shadow-lg ring-2 ring-warning/60 scale-[1.02]'
              : 'border-border bg-card text-neutral-foreground hover:text-foreground'
          }`}
        >
          <span className="w-6 h-6 rounded-full bg-warning/30 flex items-center justify-center text-[10px] font-bold">2</span>
          <span className="truncate">📋 2. DIRECTIVE AI</span>
        </div>

        <div
          onClick={() => handleManualTabClick('dispatch')}
          className={`p-3.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
            simState === 'dispatch'
              ? 'border-warning bg-warning/20 text-warning font-bold shadow-lg ring-2 ring-warning/60 scale-[1.02]'
              : 'border-border bg-card text-neutral-foreground hover:text-foreground'
          }`}
        >
          <span className="w-6 h-6 rounded-full bg-warning/30 flex items-center justify-center text-[10px] font-bold">3</span>
          <span className="truncate">📡 3. DISPATCH ENGINE</span>
        </div>

        <div
          onClick={() => handleManualTabClick('success')}
          className={`p-3.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
            simState === 'success'
              ? 'border-success bg-success/20 text-success font-bold shadow-lg ring-2 ring-success/60 scale-[1.02]'
              : 'border-border bg-card text-neutral-foreground hover:text-foreground'
          }`}
        >
          <span className="w-6 h-6 rounded-full bg-success/30 flex items-center justify-center text-[10px] font-bold">4</span>
          <span className="truncate">✅ 4. AUDIT SUCCESS</span>
        </div>
      </div>

      {/* SIMULATION DISPLAY CARD */}
      <div className="p-6 lg:p-8 rounded-3xl border border-border bg-card shadow-2xl space-y-6 relative overflow-hidden min-h-95 flex flex-col justify-between">
        {/* IDLE / INITIAL STATE */}
        {simState === 'idle' && (
          <div className="my-auto text-center space-y-6 py-8">
            <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 text-primary text-2xl flex items-center justify-center mx-auto shadow-inner animate-pulse">
              ⚡
            </div>
            <div className="space-y-2 max-w-lg mx-auto">
              <h3 className="text-xl font-black text-foreground">Interactive EOC Simulation Ready</h3>
              <p className="text-xs text-neutral-foreground leading-relaxed font-sans">
                Experience the full automated cycle: live Copilot prompt evaluation, grounded Cortex RAG reasoning, commander directive guardrails, and multi-channel broadcast dispatch with audit logging.
              </p>
            </div>
            <button
              onClick={runAutomatedSimulation}
              className="button button-primary py-4 px-8 rounded-2xl font-bold text-xs shadow-xl flex items-center gap-3 mx-auto cursor-pointer"
            >
              <span>RUN AUTOMATED SIMULATION FLOW ▶</span>
            </button>
          </div>
        )}

        {/* STEP 1: COPILOT CHAT */}
        {simState === 'chat' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-primary">
                <span className="w-2.5 h-2.5 rounded-full bg-primary animate-ping"></span>
                <span>💬 STEP 1: COPILOT CONVERSATIONAL REASONING</span>
              </div>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-primary/15 text-primary border border-primary/30 font-bold">
                CORTEX.SEARCH_PREVIEW + CORTEX.AI_COMPLETE
              </span>
            </div>

            <div className="space-y-4 max-w-3xl font-sans text-xs">
              <div className="flex justify-end">
                <div className="bg-primary text-primary-foreground p-3.5 rounded-2xl rounded-tr-xs max-w-lg shadow-sm font-sans">
                  <strong>Commander:</strong> Which areas are at greatest flood risk and what should we do?
                </div>
              </div>

              <div className="flex justify-start">
                <div className="bg-background border border-border p-4 rounded-2xl rounded-tl-xs max-w-xl space-y-2 shadow-sm font-sans relative">
                  <div className="flex items-center justify-between font-mono text-[10px] text-primary font-bold">
                    <span>🤖 SENTINEL AI COPILOT:</span>
                    {isAutomating && (
                      <span className="text-warning text-[9px] animate-pulse">REASONING OVER SOP VECTORS...</span>
                    )}
                  </div>
                  <p className="leading-relaxed">
                    According to live river telemetry and official SOPs, <strong>Tumaga River Sensor (ZAM-TUMAGA-01)</strong> has reached <strong>8.80 meters</strong> (exceeding 8.0m critical threshold).
                  </p>
                  <p className="leading-relaxed text-neutral-foreground">
                    Low-lying barangays <strong>Tumaga, Sta. Maria, and Tetuan</strong> face immediate inundation risk. Estimated 28,000 residents require evacuation support.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center text-xs font-mono">
              <span className="text-neutral-foreground italic text-[11px]">
                {isAutomating ? '⏳ Step 1 processing... Automatically advancing to Step 2...' : 'Select next step below:'}
              </span>
              <button
                onClick={() => handleManualTabClick('recommendation')}
                className="button button-primary py-2.5 px-5 rounded-xl font-bold text-xs shadow-md flex items-center gap-2 cursor-pointer"
              >
                <span>PROCEED TO DIRECTIVES →</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: DIRECTIVE RECOMMENDATIONS */}
        {simState === 'recommendation' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-warning">
                <span className="w-2.5 h-2.5 rounded-full bg-warning animate-ping"></span>
                <span>📋 STEP 2: HUMAN-IN-THE-LOOP DIRECTIVE APPROVAL</span>
              </div>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-danger/15 text-danger border border-danger/30 font-bold">
                RED ALERT (96% CONFIDENCE)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
              <div className="p-4 rounded-2xl bg-background border border-border space-y-2">
                <div className="text-primary font-bold text-[11px]">1. RESCUE ASSETS</div>
                <div className="text-foreground">Deploy 8 swift-water rescue teams & 4 ambulances to Tumaga.</div>
              </div>

              <div className="p-4 rounded-2xl bg-background border border-border space-y-2">
                <div className="text-warning font-bold text-[11px]">2. EVACUATION SHELTERS</div>
                <div className="text-foreground">Open City Coliseum & Sta. Maria gymnasium shelters.</div>
              </div>

              <div className="p-4 rounded-2xl bg-background border border-border space-y-2">
                <div className="text-success font-bold text-[11px]">3. PUBLIC BROADCAST</div>
                <div className="text-foreground">Queue 1,200 Emergency SMS & Email advisories to residents.</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-primary/10 border border-primary/25 text-xs font-sans text-neutral-foreground flex flex-col sm:flex-row items-center justify-between gap-4">
              <span>🛡️ <strong>Commander Guardrail Active:</strong> Mandatory sign-off required prior to broadcast.</span>
              <button
                onClick={() => {
                  clearAllTimers();
                  setSimState('dispatch');
                  setDispatchProgress(100);
                }}
                className="button button-primary py-2.5 px-5 rounded-xl font-bold text-xs shadow-md flex items-center gap-2 cursor-pointer"
              >
                <span>APPROVE & DISPATCH ALERTS →</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: DISPATCH ENGINE */}
        {simState === 'dispatch' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-warning">
                <span className="w-2.5 h-2.5 rounded-full bg-warning animate-ping"></span>
                <span>📡 STEP 3: MULTI-CHANNEL BROADCAST DISPATCHING...</span>
              </div>
              <span className="text-xs font-mono font-bold text-warning">{dispatchProgress}% COMPLETED</span>
            </div>

            <div className="space-y-4 font-mono text-xs">
              <div className="w-full h-4 rounded-full bg-background border border-border overflow-hidden p-0.5 shadow-inner">
                <div
                  className="h-full bg-linear-to-r from-warning via-amber-400 to-success transition-all duration-200 rounded-full shadow-md shadow-warning/40"
                  style={{ width: `${dispatchProgress}%` }}
                ></div>
              </div>

              <div className="p-4 rounded-2xl bg-background border border-border space-y-2 leading-relaxed">
                <div className="text-neutral-foreground text-[10px]">WEBSOCKET LOG STREAM:</div>
                <div className="text-foreground text-[11px]">
                  [NOTIFICATION ENGINE] Dispatching SMS Batch 1 to 1,200 registered citizen phones in Tumaga...
                </div>
                <div className="text-success text-[11px]">
                  [TWILIO RELAY] 850 SMS Messages Delivered (HTTP 200 OK)
                </div>
                <div className="text-success text-[11px]">
                  [SMTP RELAY] 350 Evacuation Email Advisories Delivered
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: SUCCESS & AUDIT PERSISTENCE */}
        {simState === 'success' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-success">
                <span className="w-2.5 h-2.5 rounded-full bg-success"></span>
                <span>✅ STEP 4: DISPATCH SUCCESSFUL & AUDITED</span>
              </div>
              <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-success/15 text-success border border-success/30 font-bold">
                100% DELIVERED
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
              <div className="p-4 rounded-2xl bg-background border border-border space-y-1 text-center">
                <div className="text-neutral-foreground text-[10px]">SMS DELIVERED</div>
                <div className="text-success font-black text-2xl">1,200 / 1,200</div>
              </div>

              <div className="p-4 rounded-2xl bg-background border border-border space-y-1 text-center">
                <div className="text-neutral-foreground text-[10px]">EMAILS DELIVERED</div>
                <div className="text-success font-black text-2xl">350 / 350</div>
              </div>

              <div className="p-4 rounded-2xl bg-background border border-border space-y-1 text-center">
                <div className="text-neutral-foreground text-[10px]">SNOWFLAKE AUDIT LOG</div>
                <div className="text-primary font-bold text-xs truncate">PUBLIC.audit_logs</div>
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center">
              <span className="text-xs text-neutral-foreground font-sans">
                🎉 Simulation complete! Every action logged to Snowflake DB.
              </span>
              <button
                onClick={runAutomatedSimulation}
                className="button button-outline py-2.5 px-5 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer"
              >
                <span>REPLAY AUTOMATION 🔄</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
