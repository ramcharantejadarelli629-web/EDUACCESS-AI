import React, { useState, useEffect } from 'react';
import { Sparkles, Image as ImageIcon, BookOpen, Globe, ShieldCheck, CheckCircle2, ArrowRight, Zap, Info } from 'lucide-react';
import { apiClient } from '../api/client';

export default function Dashboard({ onNavigateTo }) {
  const [readiness, setReadiness] = useState(null);

  useEffect(() => {
    let isMounted = true;
    apiClient.checkReadiness()
      .then((data) => {
        if (isMounted) setReadiness(data);
      })
      .catch((err) => {
        console.warn('Readiness check failed:', err);
      });
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <section
        aria-labelledby="hero-title"
        className="relative overflow-hidden p-8 md:p-12 bg-gradient-to-br from-blue-900 via-brand-800 to-indigo-900 text-white rounded-3xl shadow-xl card-panel"
      >
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/30 text-blue-100 border border-blue-400/30">
            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-blue-300" aria-hidden="true" />
            Prompt Wars — Accessibility & Inclusive Communities
          </div>

          <h1 id="hero-title" className="text-3xl md:text-5xl font-extrabold tracking-tight">
            EduAccess AI
          </h1>
          <p className="text-xl md:text-2xl font-medium text-blue-100">
            Learn Without Barriers.
          </p>

          <p className="text-sm md:text-base text-blue-100/90 leading-relaxed max-w-2xl">
            Transform dense academic textbooks, complex diagrams, scientific illustrations, and inaccessible educational articles into structured, accessible, and actionable learning experiences—without losing original meaning.
          </p>

          {/* Quick CTA Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onNavigateTo('text')}
              className="inline-flex items-center px-5 py-2.5 text-sm font-bold rounded-xl bg-white text-brand-900 hover:bg-blue-50 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-white transition-all"
            >
              <BookOpen className="w-4 h-4 mr-2 text-brand-700" aria-hidden="true" />
              Simplify Academic Text
            </button>

            <button
              type="button"
              onClick={() => onNavigateTo('diagram')}
              className="inline-flex items-center px-5 py-2.5 text-sm font-bold rounded-xl bg-blue-600/60 hover:bg-blue-600/80 text-white border border-blue-400/40 shadow-md focus:outline-none focus:ring-2 focus:ring-white transition-all"
            >
              <ImageIcon className="w-4 h-4 mr-2" aria-hidden="true" />
              Explain Diagram or PDF
            </button>
          </div>
        </div>

        {/* Ambient Decorative element */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* System Readiness & Model Transparency Bar */}
      <section aria-label="System status" className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs card-panel">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            Engine Status:
          </span>
          <span className="text-slate-600 dark:text-slate-400">
            {readiness?.status === 'ready' ? 'Operational & Ready' : 'Backend Initialized'}
          </span>
        </div>

        <div className="flex items-center space-x-3 text-slate-600 dark:text-slate-400">
          <span>Model: <strong>{readiness?.model || 'gemini-2.5-flash'}</strong></span>
          <span>•</span>
          <span>Mode: <strong className={readiness?.ai_configured ? 'text-emerald-600' : 'text-amber-600'}>
            {readiness?.ai_configured ? 'Live Google GenAI' : 'Deterministic Mock Fallback'}
          </strong></span>
          <span>•</span>
          <span>Environment: <strong>{readiness?.environment || 'Development'}</strong></span>
        </div>
      </section>

      {/* Core Features Grid */}
      <section aria-labelledby="features-heading" className="space-y-4">
        <h2 id="features-heading" className="text-xl font-bold text-slate-900 dark:text-white">
          Accessible Learning Capabilities
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div
            onClick={() => onNavigateTo('diagram')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') onNavigateTo('diagram'); }}
            className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-brand-500 dark:hover:border-brand-400 shadow-sm hover:shadow-md transition-all cursor-pointer group focus:outline-none focus:ring-2 focus:ring-brand-500 card-panel flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-brand-600 dark:text-brand-300 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <ImageIcon className="w-6 h-6" aria-hidden="true" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">
                Multimodal Diagram Explainer
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                Assists visually impaired students and visual learners. Deconstructs scientific flowcharts, charts, biological schematics, and PDF lecture pages into spatial layouts, directional flows, and audio narration.
              </p>
            </div>
            <div className="flex items-center text-xs font-semibold text-brand-600 dark:text-brand-400 group-hover:underline">
              Launch Diagram Analyzer <ArrowRight className="w-3.5 h-3.5 ml-1" aria-hidden="true" />
            </div>
          </div>

          {/* Card 2 */}
          <div
            onClick={() => onNavigateTo('text')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') onNavigateTo('text'); }}
            className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-brand-500 dark:hover:border-brand-400 shadow-sm hover:shadow-md transition-all cursor-pointer group focus:outline-none focus:ring-2 focus:ring-brand-500 card-panel flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <BookOpen className="w-6 h-6" aria-hidden="true" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">
                Cognitive Text Simplifier
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                Supports dyslexia and ADHD learning workflows. Offers adjustable reading levels (Simple, Standard, Detailed), Bionic visual anchors, structured study checklists, and source-faithful comprehension checks.
              </p>
            </div>
            <div className="flex items-center text-xs font-semibold text-brand-600 dark:text-brand-400 group-hover:underline">
              Simplify Academic Text <ArrowRight className="w-3.5 h-3.5 ml-1" aria-hidden="true" />
            </div>
          </div>

          {/* Card 3 */}
          <div
            onClick={() => onNavigateTo('url')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') onNavigateTo('url'); }}
            className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-brand-500 dark:hover:border-brand-400 shadow-sm hover:shadow-md transition-all cursor-pointer group focus:outline-none focus:ring-2 focus:ring-brand-500 card-panel flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Globe className="w-6 h-6" aria-hidden="true" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">
                Safe Educational URL Reader
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                Fetches public open-access educational articles with full SSRF defense, streaming size limits, and script stripping, directly producing accessible plain-language study summaries.
              </p>
            </div>
            <div className="flex items-center text-xs font-semibold text-brand-600 dark:text-brand-400 group-hover:underline">
              Read Public Web Article <ArrowRight className="w-3.5 h-3.5 ml-1" aria-hidden="true" />
            </div>
          </div>
        </div>
      </section>

      {/* Social Impact & Inclusiveness Commitment */}
      <section aria-labelledby="impact-heading" className="p-6 bg-slate-100 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
        <h3 id="impact-heading" className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
          <Info className="w-4 h-4 mr-2 text-brand-600 dark:text-brand-400" aria-hidden="true" />
          Inclusive Education & Ethical AI Standards
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          EduAccess AI adheres to the WCAG 2.2 AA standard, privacy data-minimization, and anti-hallucination guardrails. Accessibility features are adjustable and non-prescriptive: no medical diagnosis is ever made, and students retain complete autonomy over their visual, cognitive, and auditory learning tools.
        </p>
      </section>
    </div>
  );
}
