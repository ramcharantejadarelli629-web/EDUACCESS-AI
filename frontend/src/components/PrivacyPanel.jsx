import React from 'react';
import { ShieldCheck, Lock, EyeOff, Trash2, Info } from 'lucide-react';

export default function PrivacyPanel({ onClearAllData }) {
  return (
    <div
      role="region"
      aria-label="Privacy, data handling, and security disclosure"
      className="p-6 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm card-panel my-8"
    >
      <div className="flex items-center space-x-3 mb-4">
        <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Trust, Privacy & Security Architecture
        </h2>
      </div>

      <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
        EduAccess AI follows a strict <strong>data-minimization</strong> and <strong>zero-retention</strong> architecture.
        We ensure student learning materials and cognitive preferences remain private, unmonitored, and secure.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2 text-brand-600 dark:text-brand-400 mb-2 font-semibold text-sm">
            <Lock className="w-4 h-4" aria-hidden="true" />
            <span>Zero Server Persistence</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Uploaded images, PDFs, and pasted academic texts are analyzed directly in memory streams and are <strong>never stored on server disk</strong> or in a database.
          </p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2 text-brand-600 dark:text-brand-400 mb-2 font-semibold text-sm">
            <EyeOff className="w-4 h-4" aria-hidden="true" />
            <span>No User Profiling</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            We never create disability profiles, log personal identifiers, or infer medical conditions. Preferences are stored strictly in your local browser storage.
          </p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2 text-brand-600 dark:text-brand-400 mb-2 font-semibold text-sm">
            <Info className="w-4 h-4" aria-hidden="true" />
            <span>AI Verification Notice</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            AI explanations support inclusive learning but do not replace human educators or official curricula. Always verify critical safety warnings and equations.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center space-x-2">
          <span>SSRF Defense: Active</span>
          <span>•</span>
          <span>Prompt-Injection Shields: Active</span>
          <span>•</span>
          <span>Decompression Bomb Defense: Active</span>
        </div>

        {onClearAllData && (
          <button
            type="button"
            onClick={onClearAllData}
            aria-label="Clear all current session data and results"
            className="inline-flex items-center text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 rounded px-2 py-1"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
            Clear Current Session Data
          </button>
        )}
      </div>
    </div>
  );
}
