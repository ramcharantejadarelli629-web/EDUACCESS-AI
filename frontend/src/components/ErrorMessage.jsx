import React from 'react';
import { AlertCircle, X } from 'lucide-react';

export default function ErrorMessage({ title = 'Action Required', message, onDismiss }) {
  if (!message) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="p-4 my-4 bg-red-50 dark:bg-red-950/40 border-l-4 border-red-600 rounded-r-lg shadow-sm text-red-900 dark:text-red-200 card-panel"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
          <div>
            <h3 className="font-semibold text-sm text-red-800 dark:text-red-300">
              {title}
            </h3>
            <p className="mt-1 text-sm text-red-700 dark:text-red-200">
              {message}
            </p>
          </div>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss error message"
            className="p-1 text-red-700 dark:text-red-300 hover:text-red-900 rounded focus:outline-none focus:ring-2 focus:ring-red-600"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
