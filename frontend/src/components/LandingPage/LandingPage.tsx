import React from 'react';
import type { User } from '../../firebase';
import { EOCWorkflowSimulator } from './EOCWorkflowSimulator';

interface LandingPageProps {
  user: User | null;
  isAuthLoading: boolean;
  onGoogleSignIn: () => void;
  onEnterDashboard: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ user, isAuthLoading, onGoogleSignIn, onEnterDashboard }) => {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16 select-none">

      {/* ── 1. HERO ─────────────────────────────────────────────────────────── */}
      <section
        aria-labelledby="hero-heading"
        className="relative rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden"
      >
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(#E2E8F0 1px, transparent 1px), linear-gradient(90deg, #E2E8F0 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
          aria-hidden="true"
        />

        <div className="relative z-10 px-8 lg:px-14 py-12 lg:py-16 flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto">
          {/* Hackathon chip */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-[10px] font-mono font-bold uppercase tracking-wider shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" aria-hidden="true"></span>
            Snowflake Cortex AI &amp; CoCo CLI Hackathon Entry
          </div>

          <h1
            id="hero-heading"
            className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 dark:text-white leading-none"
          >
            Sentinel{' '}
            <span className="text-[#1976D2]">AI</span>
            <span className="block text-xl sm:text-2xl lg:text-3xl font-bold text-slate-500 dark:text-slate-400 tracking-tight mt-4">
              Autonomous Emergency Operations Copilot
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed font-medium">
            Sentinel AI transforms raw disaster telemetry into instant, life-saving operational directives.
            Grounded by{' '}
            <strong className="text-slate-900 dark:text-white">Snowflake Cortex AI</strong>{' '}
            (<code className="text-[#1976D2] font-mono text-xs bg-blue-50 dark:bg-blue-950/60 px-1 py-0.5 rounded">AI_COMPLETE</code> &amp; SOP RAG),
            real-time GIS river risk maps, and multi-channel public alert dispatch.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            {user ? (
              <button
                id="launch-dashboard-btn"
                onClick={onEnterDashboard}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#1976D2] hover:bg-[#1565C0] active:bg-[#0D47A1] text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1976D2] focus-visible:ring-offset-2"
              >
                <span>Launch Command Center</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            ) : (
              <button
                id="google-signin-hero-btn"
                onClick={onGoogleSignIn}
                disabled={isAuthLoading}
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-lg bg-[#1976D2] hover:bg-[#1565C0] active:bg-[#0D47A1] text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1976D2] focus-visible:ring-offset-2"
              >
                <svg className="w-4 h-4 bg-white rounded-sm p-px flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Sign in with Google to Access EOC</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Telemetry Metrics strip */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 border-t border-slate-200 dark:border-slate-800">
          <div className="px-6 py-4 flex items-center justify-between border-b sm:border-b-0 sm:border-r border-slate-200 dark:border-slate-800">
            <div className="space-y-0.5">
              <div className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tumaga River Sensor</div>
              <div className="text-slate-900 dark:text-white font-black font-mono text-lg tabular-nums">8.80 m</div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border shadow-xs bg-rose-50 dark:bg-rose-950/60 text-[#D32F2F] dark:text-rose-300 border-rose-200 dark:border-rose-900">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" aria-hidden="true"></span>
              Critical Breach
            </span>
          </div>

          <div className="px-6 py-4 flex items-center justify-between border-b sm:border-b-0 sm:border-r border-slate-200 dark:border-slate-800">
            <div className="space-y-0.5">
              <div className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">PAGASA Precipitation</div>
              <div className="text-slate-900 dark:text-white font-black font-mono text-lg tabular-nums">175 mm</div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border shadow-xs bg-amber-50 dark:bg-amber-950/60 text-[#ED6C02] dark:text-amber-300 border-amber-200 dark:border-amber-800">
              Heavy Surge
            </span>
          </div>

          <div className="px-6 py-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Affected Population</div>
              <div className="text-slate-900 dark:text-white font-black font-mono text-lg tabular-nums">28,000</div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border shadow-xs bg-blue-50 dark:bg-blue-950/60 text-[#1976D2] dark:text-blue-300 border-blue-200 dark:border-blue-800">
              3 Barangays
            </span>
          </div>
        </div>
      </section>

      {/* ── 1.5 WORKFLOW SIMULATOR ──────────────────────────────────────────── */}
      <EOCWorkflowSimulator />

      {/* ── 2. PROBLEM VS SOLUTION ──────────────────────────────────────────── */}
      <section aria-labelledby="problem-solution-heading" className="space-y-6">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="text-[10px] font-mono font-bold text-[#1976D2] tracking-widest uppercase mb-1">
            Disaster Management Paradigm Shift
          </div>
          <h2 id="problem-solution-heading" className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            The Problem &amp; Sentinel AI Solution Flow
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Bottlenecks */}
          <div className="p-5 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 space-y-4 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500" aria-hidden="true"></span>
              <span className="text-[10px] font-mono font-bold text-[#D32F2F] dark:text-rose-300 uppercase tracking-wider">
                Traditional Emergency Bottlenecks
              </span>
            </div>
            <ul className="space-y-3 text-xs text-slate-500 dark:text-slate-400">
              {[
                { label: 'Data Silos:', desc: 'Telemetry data scattered across separate weather dashboards, manual paper SOP binder logs, and uncoordinated SMS lists.' },
                { label: 'Slow Risk Analysis:', desc: 'Assessing population impact across high-risk barangays requires hours of manual cross-referencing during critical flash floods.' },
                { label: 'Unchecked AI Risk:', desc: 'Fully automated bots risk sending unverified emergency advisories without human commander sign-off.' },
                { label: 'No Execution Tracking:', desc: 'Outgoing SMS broadcasts lack real-time delivery logs or audit trails for post-disaster agency debriefing.' },
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <svg className="w-3.5 h-3.5 text-[#D32F2F] dark:text-rose-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span><strong className="text-slate-700 dark:text-slate-200">{item.label}</strong>{' '}{item.desc}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Resolution */}
          <div className="p-5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-4 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true"></span>
              <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                Sentinel AI Grounded Resolution
              </span>
            </div>
            <ul className="space-y-3 text-xs text-slate-500 dark:text-slate-400">
              {[
                { label: 'Unified Data Warehouse:', desc: 'Centralized Snowflake DB schema storing sensor streams, weather metrics, census statistics, and SOP documents.' },
                { label: 'Sub-2s Cortex Reasoning:', desc: 'CORTEX.SEARCH_PREVIEW SOP RAG retrieval combined with SNOWFLAKE.CORTEX.AI_COMPLETE for grounded generation.' },
                { label: 'Commander Approval Guardrail:', desc: 'Mandatory human-in-the-loop review ensures commanders verify AI directives before public dispatch.' },
                { label: 'Immutable Audit Logs:', desc: 'Multi-channel broadcast engine streams live WebSocket progress and persists immutable records into Snowflake audit_logs.' },
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <svg className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                  <span><strong className="text-slate-700 dark:text-slate-200">{item.label}</strong>{' '}{item.desc}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── 3. INCIDENT WALKTHROUGH ─────────────────────────────────────────── */}
      <section aria-labelledby="walkthrough-heading" className="space-y-6">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="text-[10px] font-mono font-bold text-[#1976D2] tracking-widest uppercase mb-1">Real-World Disaster Demonstration</div>
          <h2 id="walkthrough-heading" className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Typhoon Flood Incident Walkthrough
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { step: '01', tag: 'Telemetry', tagColor: 'text-[#D32F2F] dark:text-rose-300', title: 'Typhoon Surge & Breach', desc: <> Monsoon rainfall hits 175 mm. River sensor <code className="font-mono text-[#1976D2] text-[10px]">ZAM-TUMAGA-01</code> reaches <strong>8.8 m</strong>, breaching the 8.0 m critical threshold.</> },
            { step: '02', tag: 'Copilot', tagColor: 'text-[#ED6C02] dark:text-amber-300', title: 'Commander Query', desc: <>Commander asks: <em>"Which areas are at greatest flood risk?"</em> Copilot runs SOP search &amp; returns Tumaga, Sta. Maria, and Tetuan (&lt;2 s).</> },
            { step: '03', tag: 'Guardrail', tagColor: 'text-[#1976D2] dark:text-blue-300', title: 'Directive Recommendation', desc: <>Copilot recommends upgrading to <strong>Orange Alert</strong>, deploying 8 swift-water rescue teams, opening evacuation gyms, and issuing SMS/Email alerts.</> },
            { step: '04', tag: 'Dispatch', tagColor: 'text-emerald-700 dark:text-emerald-300', title: 'Human Approval & Dispatch', desc: <>Commander clicks <strong>Approve Directive</strong>. The Job Execution Engine queues and dispatches 1,200 SMS/Email alerts, streaming WebSocket logs into Snowflake.</> },
          ].map((item) => (
            <article key={item.step} className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-[#1976D2] dark:text-blue-300 font-mono font-bold flex items-center justify-center text-xs">
                  {item.step}
                </span>
                <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${item.tagColor}`}>{item.tag}</span>
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">{item.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── 4. SYSTEM ARCHITECTURE ──────────────────────────────────────────── */}
      <section aria-labelledby="architecture-heading" className="space-y-6">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="text-[10px] font-mono font-bold text-[#1976D2] tracking-widest uppercase mb-1">Technical Architecture</div>
          <h2 id="architecture-heading" className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            End-to-End System Architecture &amp; Cortex Pipeline
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Stage 1 */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col gap-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider shadow-xs">Stage 1</span>
              <svg className="w-4 h-4 text-[#1976D2]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21.75 9.75A9.75 9.75 0 0012 0m9.75 9.75c0 5.385-4.365 9.75-9.75 9.75m9.75-9.75H12m0 0V0M3.75 6a9.75 9.75 0 0112.347-2.347M8.25 20.25A9.75 9.75 0 0112 21.75" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1">Data Platform Layer</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Real-time Open-Meteo weather APIs and river water sensors continuously ingest telemetry into Snowflake DB.</p>
            </div>
            <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="text-[10px] font-bold text-[#1976D2] uppercase tracking-wider mb-1">Snowflake Schemas</div>
              {['PUBLIC.river_sensors', 'PUBLIC.weather_data', 'PUBLIC.SENTINEL_SOPS'].map((s) => (
                <div key={s} className="px-2 py-1 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono font-medium text-[10px]">{s}</div>
              ))}
            </div>
          </div>

          {/* Stage 2 */}
          <div className="lg:col-span-2 p-5 rounded-xl border border-blue-200 dark:border-blue-800/60 bg-white dark:bg-slate-900 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-[10px] font-mono font-bold text-[#1976D2] dark:text-blue-300 uppercase tracking-wider shadow-xs">Stage 2 · Cortex AI Engine</span>
              <svg className="w-4 h-4 text-[#1976D2]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21M9 9h6v6H9V9z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1">FastAPI &amp; Snowflake Cortex Query Layer</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">FastAPI handles async REST &amp; WebSocket requests, orchestrating Snowflake Cortex functions for instant SOP retrieval and grounded AI generation.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { color: 'text-[#1976D2]', label: '1. SOP Vector RAG Search', code: 'CORTEX.SEARCH_PREVIEW', desc: 'Retrieves official SOP embeddings' },
                { color: 'text-emerald-700 dark:text-emerald-300', label: '2. Low-Latency LLM Reasoning', code: 'CORTEX.AI_COMPLETE', desc: 'Grounded prompt text generation' },
              ].map((item) => (
                <div key={item.label} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 space-y-1">
                  <div className={`text-[10px] font-bold uppercase tracking-wider ${item.color}`}>{item.label}</div>
                  <code className="text-slate-700 dark:text-slate-300 text-[10px] block font-mono">{item.code}</code>
                  <div className="text-[9px] text-slate-500 dark:text-slate-400">{item.desc}</div>
                </div>
              ))}
              <div className="sm:col-span-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#ED6C02] dark:text-amber-300">3. Autonomous Skill Routing</div>
                <code className="text-slate-700 dark:text-slate-300 text-[10px] block font-mono">SNOWFLAKE.CORTEX.AGENT_RUN(agent_spec, FALSE)</code>
                <div className="text-[9px] text-slate-500 dark:text-slate-400">Multi-tool CoCo CLI agent orchestration for complex multi-turn workflows</div>
              </div>
            </div>
          </div>

          {/* Stage 3 & 4 */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col gap-4 hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider shadow-xs">Stage 3 &amp; 4</span>
              <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1">Guardrail &amp; Broadcast</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Mandatory human-in-the-loop commander sign-off triggers SMS &amp; Email broadcast dispatches with live audit logging.</p>
            </div>
            <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider mb-1">Dispatch Engine</div>
              {[
                { label: 'Multi-Channel SMS', value: 'Twilio', color: 'text-emerald-700 dark:text-emerald-300' },
                { label: 'Email Advisory', value: 'SMTP Relay', color: 'text-emerald-700 dark:text-emerald-300' },
                { label: 'Audit Persistence', value: 'Snowflake', color: 'text-[#1976D2] dark:text-blue-300' },
              ].map((row) => (
                <div key={row.label} className="px-2 py-1 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] flex justify-between">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">{row.label}</span>
                  <span className={`font-bold font-mono ${row.color}`}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. AGENT SKILLS MATRIX ──────────────────────────────────────────── */}
      <section aria-labelledby="skills-heading" className="space-y-6">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="text-[10px] font-mono font-bold text-[#1976D2] tracking-widest uppercase mb-1">Agent Skills Specification</div>
          <h2 id="skills-heading" className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Snowflake CoCo CLI Agent Skills Matrix
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { name: 'weather_intelligence', desc: 'Retrieves active precipitation, wind speed, and meteorological storm classification from Open-Meteo & PAGASA feeds.' },
            { name: 'flood_risk_assessment', desc: 'Computes real-time alert levels (Red/Orange/Yellow) based on water level sensor thresholds (8.0 m critical) and tidal metrics.' },
            { name: 'population_impact', desc: 'Aggregates impacted demographic metrics across barangays requiring immediate evacuation and shelter support.' },
            { name: 'resource_recommendation', desc: 'Recommends swift-water rescue teams, inflatable boats, ambulances, and available evacuation shelter facilities.' },
            { name: 'alert_generator', desc: 'Crafts localized multi-channel advisories in English & Tagalog for SMS, email, and public announcement relays.' },
            { name: 'notification_dispatcher', desc: 'Launches multi-channel alert campaigns via the Job Execution Engine with tracking counters and Snowflake audit logs.' },
          ].map((skill, i) => (
            <article key={skill.name} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded-md">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <code className="text-[#1976D2] font-mono font-bold text-xs">{skill.name}</code>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{skill.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── 6. TECH STACK FOOTER ────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 dark:border-slate-800 pt-8 pb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          {['Snowflake Cortex AI', 'CoCo CLI', 'FastAPI (Python 3.12)', 'MapLibre GL', 'Firebase Auth'].map((tech) => (
            <span key={tech} className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300 shadow-xs">
              {tech}
            </span>
          ))}
        </div>
        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
          Sentinel AI &copy; 2026 — Emergency Operations Copilot
        </span>
      </footer>
    </div>
  );
};

export default LandingPage;
