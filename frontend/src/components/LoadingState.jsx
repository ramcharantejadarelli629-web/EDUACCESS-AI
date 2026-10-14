import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingState({ message = 'Transforming educational content...', subtext = 'Processing with accessibility preservation standards' }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="p-8 my-6 text-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm card-panel"
    >
      <div className="flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-brand-600 animate-spin" aria-hidden="true" />
        <div className="space-y-1">
          <p className="text-lg font-semibold text-slate-900 dark:text-white">
            {message}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {subtext}
          </p>
        </div>
        <span className="sr-only">Loading, please wait. Content is being processed.</span>
      </div>
    </div>
  );
}
