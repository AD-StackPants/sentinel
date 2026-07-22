import React from 'react';
import type { User } from '../../firebase';
import { EOCWorkflowSimulator } from './EOCWorkflowSimulator';

interface LandingPageProps {
  user: User | null;
  isAuthLoading: boolean;
  onGoogleSignIn: () => void;
  onEnterDashboard: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({
  user,
  isAuthLoading,
  onGoogleSignIn,
  onEnterDashboard,
}) => {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16 select-none">
      {/* 1. HERO SECTION */}
      <section className="relative rounded-3xl border border-border bg-linear-to-b from-card via-card/90 to-background p-8 lg:p-14 overflow-hidden shadow-2xl space-y-12">
        {/* Glowing Background Radial Accents */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-150 h-75 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col items-center text-center space-y-6 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-mono font-bold shadow-xs">
            <span className="w-2 h-2 rounded-full bg-danger animate-pulse"></span>
            <span>SNOWFLAKE CORTEX AI & COCO CLI HACKATHON ENTRY</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-foreground leading-none">
            SENTINEL <span className="bg-linear-to-r from-primary via-blue-400 to-cyan-400 bg-clip-text text-transparent">AI</span>
            <span className="block text-xl sm:text-3xl lg:text-4xl font-bold text-foreground/90 tracking-tight mt-4">
              Autonomous Emergency Operations Copilot
            </span>
          </h1>

          <p className="text-sm sm:text-base lg:text-lg text-neutral-foreground font-sans max-w-2xl leading-relaxed">
            Sentinel AI transforms raw disaster telemetry into instant, life-saving operational directives. Grounded by <strong>Snowflake Cortex AI (<code className="text-primary font-mono text-xs">AI_COMPLETE</code> & SOP RAG)</strong>, real-time GIS river risk maps, and multi-channel public alert dispatches.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            {user ? (
              <button
                onClick={onEnterDashboard}
                className="button button-primary py-4 px-8 rounded-2xl font-bold text-sm shadow-xl hover:shadow-primary/30 flex items-center gap-3 transition-all duration-200 cursor-pointer"
              >
                <span>LAUNCH COMMAND CENTER DASHBOARD</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            ) : (
              <button
                onClick={onGoogleSignIn}
                disabled={isAuthLoading}
                className="button button-primary py-4 px-8 rounded-2xl font-bold text-sm shadow-xl hover:shadow-primary/30 flex items-center gap-3 transition-all duration-200 cursor-pointer"
              >
                <svg className="w-5 h-5 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>SIGN IN WITH GOOGLE TO ACCESS EOC</span>
              </button>
            )}
          </div>
        </div>

        {/* High-Tech Live Incident Telemetry Metrics Card */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 font-mono text-xs max-w-4xl mx-auto w-full">
          <div className="p-4 rounded-2xl border border-border bg-card/90 shadow-lg flex items-center justify-between backdrop-blur-md">
            <div className="space-y-1 text-left">
              <div className="text-neutral-foreground text-[10px] uppercase tracking-wider font-bold">TUMAGA RIVER SENSOR</div>
              <div className="text-foreground font-black text-lg">8.80 Meters</div>
            </div>
            <span className="px-3 py-1 rounded-full bg-danger/15 text-danger font-bold text-[10px] border border-danger/30 animate-pulse">
              CRITICAL BREACH
            </span>
          </div>

          <div className="p-4 rounded-2xl border border-border bg-card/90 shadow-lg flex items-center justify-between backdrop-blur-md">
            <div className="space-y-1 text-left">
              <div className="text-neutral-foreground text-[10px] uppercase tracking-wider font-bold">PAGASA PRECIPITATION</div>
              <div className="text-foreground font-black text-lg">175 mm Rainfall</div>
            </div>
            <span className="px-3 py-1 rounded-full bg-warning/15 text-warning font-bold text-[10px] border border-warning/30">
              HEAVY SURGE
            </span>
          </div>

          <div className="p-4 rounded-2xl border border-border bg-card/90 shadow-lg flex items-center justify-between backdrop-blur-md">
            <div className="space-y-1 text-left">
              <div className="text-neutral-foreground text-[10px] uppercase tracking-wider font-bold">AFFECTED POPULATION</div>
              <div className="text-foreground font-black text-lg">28,000 Residents</div>
            </div>
            <span className="px-3 py-1 rounded-full bg-primary/15 text-primary font-bold text-[10px] border border-primary/30">
              3 BARANGAYS
            </span>
          </div>
        </div>
      </section>

      {/* 1.5 END-TO-END WORKFLOW SIMULATOR COMPONENT */}
      <EOCWorkflowSimulator />

      {/* 2. PROBLEM VS. SOLUTION FLOW */}
      <section className="space-y-6">
        <div className="border-b border-border pb-3">
          <div className="text-xs font-mono font-bold text-primary tracking-widest uppercase">DISASTER MANAGEMENT PARADIGM SHIFT</div>
          <h2 className="text-2xl font-black tracking-tight text-foreground">
            The Problem & Sentinel AI Solution Flow
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* TRADITIONAL DISASTER CHALLENGES */}
          <div className="p-6 rounded-xl border border-danger/30 bg-danger/5 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 text-danger font-bold text-sm font-mono">
              <span className="w-2.5 h-2.5 rounded-full bg-danger"></span>
              TRADITIONAL EMERGENCY BOTTLENECKS
            </div>
            <ul className="space-y-3 text-xs text-neutral-foreground font-sans">
              <li className="flex items-start gap-2">
                <span className="text-danger font-bold">❌</span>
                <span><strong>Data Silos:</strong> Telemetry data scattered across separate weather dashboards, manual paper SOP binder logs, and uncoordinated SMS lists.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-danger font-bold">❌</span>
                <span><strong>Slow Risk Analysis:</strong> Assessing population impact across high-risk barangays requires hours of manual cross-referencing during critical flash floods.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-danger font-bold">❌</span>
                <span><strong>Unchecked AI Risk:</strong> Fully automated bots risk sending unverified emergency advisories without human commander sign-off.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-danger font-bold">❌</span>
                <span><strong>No Execution Tracking:</strong> Outgoing SMS broadcasts lack real-time delivery logs or audit trails for post-disaster agency debriefing.</span>
              </li>
            </ul>
          </div>

          {/* SENTINEL AI RESOLUTION */}
          <div className="p-6 rounded-xl border border-success/30 bg-success/5 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 text-success font-bold text-sm font-mono">
              <span className="w-2.5 h-2.5 rounded-full bg-success"></span>
              SENTINEL AI GROUNDED RESOLUTION
            </div>
            <ul className="space-y-3 text-xs text-neutral-foreground font-sans">
              <li className="flex items-start gap-2">
                <span className="text-success font-bold">✓</span>
                <span><strong>Unified Data Warehouse:</strong> Centralized Snowflake DB schema storing sensor streams, weather metrics, census statistics, and SOP documents.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-success font-bold">✓</span>
                <span><strong>Sub-2s Cortex Reasoning:</strong> <code className="font-mono text-success">CORTEX.SEARCH_PREVIEW</code> SOP RAG retrieval combined with <code className="font-mono text-success">SNOWFLAKE.CORTEX.AI_COMPLETE</code>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-success font-bold">✓</span>
                <span><strong>Commander Approval Guardrail:</strong> Mandatory human-in-the-loop review ensures commanders verify AI directives before public dispatch.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-success font-bold">✓</span>
                <span><strong>Immutable Audit Logs:</strong> Multi-channel broadcast engine streams live WebSocket progress and persists immutable records into Snowflake <code className="font-mono text-success">audit_logs</code>.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 3. OPERATIONAL DISASTER SCENARIO WALKTHROUGH */}
      <section className="space-y-6">
        <div className="border-b border-border pb-3">
          <div className="text-xs font-mono font-bold text-primary tracking-widest uppercase">REAL-WORLD DISASTER DEMONSTRATION</div>
          <h2 className="text-2xl font-black tracking-tight text-foreground">
            Typhoon Flood Incident Walkthrough
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-5 rounded-xl border border-border bg-card space-y-3 shadow-sm hover:border-primary/50 transition-all">
            <div className="flex items-center justify-between">
              <span className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/30 text-primary font-mono font-bold flex items-center justify-center text-xs">
                01
              </span>
              <span className="text-[10px] font-mono text-danger font-bold">TELEMETRY</span>
            </div>
            <h3 className="font-bold text-sm text-foreground">Typhoon Surge & Breach</h3>
            <p className="text-xs text-neutral-foreground leading-relaxed">
              Monsoon rainfall hits 175mm. River sensor <code className="font-mono text-primary">ZAM-TUMAGA-01</code> reaches <strong>8.8m</strong>, breaching the critical 8.0m threshold.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-border bg-card space-y-3 shadow-sm hover:border-primary/50 transition-all">
            <div className="flex items-center justify-between">
              <span className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/30 text-primary font-mono font-bold flex items-center justify-center text-xs">
                02
              </span>
              <span className="text-[10px] font-mono text-warning font-bold">COPILOT</span>
            </div>
            <h3 className="font-bold text-sm text-foreground">Commander Query</h3>
            <p className="text-xs text-neutral-foreground leading-relaxed">
              Commander asks: <em>"Which areas are at greatest flood risk?"</em> Copilot runs SOP search & returns Tumaga, Sta. Maria, and Tetuan (&lt;2s).
            </p>
          </div>

          <div className="p-5 rounded-xl border border-border bg-card space-y-3 shadow-sm hover:border-primary/50 transition-all">
            <div className="flex items-center justify-between">
              <span className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/30 text-primary font-mono font-bold flex items-center justify-center text-xs">
                03
              </span>
              <span className="text-[10px] font-mono text-primary font-bold">GUARDRAIL</span>
            </div>
            <h3 className="font-bold text-sm text-foreground">Directive Recommendation</h3>
            <p className="text-xs text-neutral-foreground leading-relaxed">
              Copilot recommends upgrading to <strong>Orange Alert</strong>, deploying 8 swift-water rescue teams, opening evacuation gyms, and issuing public SMS/Email alerts.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-border bg-card space-y-3 shadow-sm hover:border-primary/50 transition-all">
            <div className="flex items-center justify-between">
              <span className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/30 text-primary font-mono font-bold flex items-center justify-center text-xs">
                04
              </span>
              <span className="text-[10px] font-mono text-success font-bold">DISPATCH</span>
            </div>
            <h3 className="font-bold text-sm text-foreground">Human Approval & Dispatch</h3>
            <p className="text-xs text-neutral-foreground leading-relaxed">
              Commander clicks <strong>Approve Directive</strong>. The Job Execution Engine queues and dispatches 1,200 SMS/Email alerts, streaming WebSocket logs into Snowflake.
            </p>
          </div>
        </div>
      </section>

      {/* 4. SYSTEM ARCHITECTURE & FASTAPI CORTEX FLOW */}
      <section className="space-y-6">
        <div className="border-b border-border pb-3">
          <div className="text-xs font-mono font-bold text-primary tracking-widest uppercase">TECHNICAL ARCHITECTURE</div>
          <h2 className="text-2xl font-black tracking-tight text-foreground">
            End-to-End System Architecture & Cortex Pipeline
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 relative">
          {/* STAGE 1: TELEMETRY & DATA WAREHOUSE */}
          <div className="p-6 rounded-2xl border border-border bg-card shadow-lg flex flex-col justify-between space-y-4 hover:border-primary/50 transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-mono font-bold">
                  STAGE 1
                </span>
                <span className="text-lg">🛰️</span>
              </div>
              <h3 className="font-bold text-base text-foreground">Data Platform Layer</h3>
              <p className="text-xs text-neutral-foreground leading-relaxed">
                Real-time Open-Meteo weather APIs and river water sensors continuously ingest telemetry into Snowflake DB.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-border font-mono text-[11px]">
              <div className="text-primary font-bold text-[10px] uppercase">SNOWFLAKE SCHEMAS</div>
              <div className="px-2 py-1 rounded bg-background border border-border text-foreground font-semibold">
                PUBLIC.river_sensors
              </div>
              <div className="px-2 py-1 rounded bg-background border border-border text-foreground font-semibold">
                PUBLIC.weather_data
              </div>
              <div className="px-2 py-1 rounded bg-background border border-border text-foreground font-semibold">
                PUBLIC.SENTINEL_SOPS
              </div>
            </div>
          </div>

          {/* STAGE 2: FASTAPI & CORTEX AI PIPELINE */}
          <div className="lg:col-span-2 p-6 rounded-2xl border border-primary/40 bg-card/95 shadow-xl flex flex-col justify-between space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none"></div>

            <div className="space-y-3 relative z-10">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-mono font-bold">
                  STAGE 2 • CORTEX AI ENGINE
                </span>
                <span className="text-lg">🤖</span>
              </div>
              <h3 className="font-bold text-base text-foreground">FastAPI & Snowflake Cortex Query Layer</h3>
              <p className="text-xs text-neutral-foreground leading-relaxed">
                FastAPI handles asynchronous REST & WebSocket requests, orchestrating Snowflake Cortex functions for instant SOP retrieval and grounded AI generation.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 font-mono text-[11px] relative z-10">
              <div className="p-3 rounded-xl bg-background border border-border space-y-1">
                <div className="text-primary font-bold text-[10px]">1. SOP VECTOR RAG SEARCH</div>
                <code className="text-foreground text-[10px] block truncate">
                  CORTEX.SEARCH_PREVIEW
                </code>
                <div className="text-[9px] text-neutral-foreground">Retrieves official SOP embeddings</div>
              </div>

              <div className="p-3 rounded-xl bg-background border border-border space-y-1">
                <div className="text-success font-bold text-[10px]">2. LOW-LATENCY LLM REASONING</div>
                <code className="text-foreground text-[10px] block truncate">
                  CORTEX.AI_COMPLETE
                </code>
                <div className="text-[9px] text-neutral-foreground">Grounded prompt text generation</div>
              </div>

              <div className="sm:col-span-2 p-3 rounded-xl bg-background border border-border space-y-1">
                <div className="text-warning font-bold text-[10px]">3. AUTONOMOUS SKILL ROUTING</div>
                <code className="text-foreground text-[10px] block truncate">
                  SNOWFLAKE.CORTEX.AGENT_RUN(agent_spec, FALSE)
                </code>
                <div className="text-[9px] text-neutral-foreground">Multi-tool CoCo CLI agent orchestration for complex multi-turn workflows</div>
              </div>
            </div>
          </div>

          {/* STAGE 3 & 4: GUARDRAIL & DISPATCH */}
          <div className="p-6 rounded-2xl border border-border bg-card shadow-lg flex flex-col justify-between space-y-4 hover:border-primary/50 transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full bg-success/15 text-success border border-success/30 text-[10px] font-mono font-bold">
                  STAGE 3 & 4
                </span>
                <span className="text-lg">🛡️</span>
              </div>
              <h3 className="font-bold text-base text-foreground">Guardrail & Broadcast</h3>
              <p className="text-xs text-neutral-foreground leading-relaxed">
                Mandatory human-in-the-loop commander sign-off triggers SMS & Email broadcast dispatches with live audit logging.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-border font-mono text-[11px]">
              <div className="text-success font-bold text-[10px] uppercase">DISPATCH ENGINE</div>
              <div className="px-2 py-1 rounded bg-background border border-border text-foreground font-semibold flex justify-between">
                <span>Multi-Channel SMS</span>
                <span className="text-success">Twilio</span>
              </div>
              <div className="px-2 py-1 rounded bg-background border border-border text-foreground font-semibold flex justify-between">
                <span>Email Advisory</span>
                <span className="text-success">SMTP Relay</span>
              </div>
              <div className="px-2 py-1 rounded bg-background border border-border text-foreground font-semibold flex justify-between">
                <span>Audit Persistence</span>
                <span className="text-primary">Snowflake</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. COCO CLI AGENT SKILLS BREAKDOWN */}
      <section className="space-y-6">
        <div className="border-b border-border pb-3">
          <div className="text-xs font-mono font-bold text-primary tracking-widest uppercase">AGENT SKILLS SPECIFICATION</div>
          <h2 className="text-2xl font-black tracking-tight text-foreground">
            Snowflake CoCo CLI Agent Skills Matrix
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-mono text-xs">
          <div className="p-5 rounded-xl border border-border bg-card space-y-2 hover:border-primary/50 transition-all">
            <div className="text-primary font-bold text-sm">1. weather_intelligence</div>
            <div className="text-neutral-foreground text-xs leading-relaxed">
              Retrieves active precipitation, wind speed, and meteorological storm classification from Open-Meteo & PAGASA feeds.
            </div>
          </div>

          <div className="p-5 rounded-xl border border-border bg-card space-y-2 hover:border-primary/50 transition-all">
            <div className="text-primary font-bold text-sm">2. flood_risk_assessment</div>
            <div className="text-neutral-foreground text-xs leading-relaxed">
              Computes real-time alert levels (Red/Orange/Yellow) based on water level sensor thresholds (8.0m critical) and tidal metrics.
            </div>
          </div>

          <div className="p-5 rounded-xl border border-border bg-card space-y-2 hover:border-primary/50 transition-all">
            <div className="text-primary font-bold text-sm">3. population_impact</div>
            <div className="text-neutral-foreground text-xs leading-relaxed">
              Aggregates impacted demographic metrics across barangays requiring immediate evacuation and shelter support.
            </div>
          </div>

          <div className="p-5 rounded-xl border border-border bg-card space-y-2 hover:border-primary/50 transition-all">
            <div className="text-primary font-bold text-sm">4. resource_recommendation</div>
            <div className="text-neutral-foreground text-xs leading-relaxed">
              Recommends swift-water rescue teams, inflatable boats, ambulances, and available evacuation shelter facilities.
            </div>
          </div>

          <div className="p-5 rounded-xl border border-border bg-card space-y-2 hover:border-primary/50 transition-all">
            <div className="text-primary font-bold text-sm">5. alert_generator</div>
            <div className="text-neutral-foreground text-xs leading-relaxed">
              Crafts localized multi-channel advisories in English & Tagalog for SMS, email, and public announcement relays.
            </div>
          </div>

          <div className="p-5 rounded-xl border border-border bg-card space-y-2 hover:border-primary/50 transition-all">
            <div className="text-primary font-bold text-sm">6. notification_dispatcher</div>
            <div className="text-neutral-foreground text-xs leading-relaxed">
              Launches multi-channel alert campaigns via the Job Execution Engine with tracking counters and Snowflake audit logs.
            </div>
          </div>
        </div>
      </section>

      {/* 6. TECHNOLOGY STACK FOOTER */}
      <section className="border-t border-border pt-8 pb-4 flex flex-wrap items-center justify-between gap-6 text-xs font-mono text-neutral-foreground">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="px-2.5 py-1 rounded bg-card border border-border font-bold text-foreground">SNOWFLAKE CORTEX AI</span>
          <span className="px-2.5 py-1 rounded bg-card border border-border font-bold text-foreground">COCO CLI</span>
          <span className="px-2.5 py-1 rounded bg-card border border-border font-bold text-foreground">FASTAPI (PYTHON 3.12)</span>
          <span className="px-2.5 py-1 rounded bg-card border border-border font-bold text-foreground">MAPLIBRE GL</span>
          <span className="px-2.5 py-1 rounded bg-card border border-border font-bold text-foreground">FIREBASE AUTH</span>
        </div>

        <div>
          SENTINEL AI &copy; 2026 — EMERGENCY OPERATIONS COPILOT
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
