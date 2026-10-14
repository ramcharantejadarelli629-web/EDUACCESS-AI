import React, { useEffect, useRef } from 'react';
import { X, Sliders, RotateCcw, Type, Eye, Volume2, Move } from 'lucide-react';
import { trapModalFocus } from '../utils/accessibility';

export default function AccessibilitySettings({ isOpen, onClose, prefs, updatePreference, resetPreferences }) {
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Focus the close button or first element when modal opens
      const closeBtn = modalRef.current?.querySelector('button');
      closeBtn?.focus();

      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          onClose();
        } else {
          trapModalFocus(e, modalRef.current);
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="a11y-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <div
        ref={modalRef}
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden card-panel flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-brand-600 dark:text-brand-400" aria-hidden="true" />
            <h2 id="a11y-modal-title" className="text-lg font-bold text-slate-900 dark:text-white">
              Personalized Accessibility Settings
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close accessibility settings"
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* Theme & Contrast */}
          <div>
            <label className="block font-semibold text-slate-900 dark:text-white mb-2 flex items-center">
              <Eye className="w-4 h-4 mr-2 text-brand-600 dark:text-brand-400" aria-hidden="true" />
              Theme & Contrast (WCAG AAA)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'light', label: 'Light' },
                { id: 'high-contrast', label: 'High Contrast (AAA)' },
                { id: 'dark', label: 'Dark' },
              ].map((themeOpt) => (
                <button
                  key={themeOpt.id}
                  type="button"
                  onClick={() => updatePreference('theme', themeOpt.id)}
                  aria-pressed={prefs.theme === themeOpt.id}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                    prefs.theme === themeOpt.id
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {themeOpt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Typography & Font Scaling */}
          <div>
            <label className="block font-semibold text-slate-900 dark:text-white mb-2 flex items-center">
              <Type className="w-4 h-4 mr-2 text-brand-600 dark:text-brand-400" aria-hidden="true" />
              Font Size Scaling
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'standard', label: 'Standard (100%)' },
                { id: 'large', label: 'Large (125%)' },
                { id: 'xlarge', label: 'Extra Large (150%)' },
              ].map((sizeOpt) => (
                <button
                  key={sizeOpt.id}
                  type="button"
                  onClick={() => updatePreference('fontSize', sizeOpt.id)}
                  aria-pressed={prefs.fontSize === sizeOpt.id}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                    prefs.fontSize === sizeOpt.id
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {sizeOpt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Line Spacing */}
          <div>
            <label className="block font-semibold text-slate-900 dark:text-white mb-2">
              Reading Line Spacing
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'normal', label: 'Normal (1.6)' },
                { id: 'relaxed', label: 'Relaxed (1.8)' },
                { id: 'loose', label: 'Loose (2.0)' },
              ].map((lineOpt) => (
                <button
                  key={lineOpt.id}
                  type="button"
                  onClick={() => updatePreference('lineSpacing', lineOpt.id)}
                  aria-pressed={prefs.lineSpacing === lineOpt.id}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                    prefs.lineSpacing === lineOpt.id
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {lineOpt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content Column Width */}
          <div>
            <label className="block font-semibold text-slate-900 dark:text-white mb-2">
              Content Reading Width (Tracking Aid)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'standard', label: 'Standard' },
                { id: 'focused', label: 'Focused (Narrow)' },
                { id: 'wide', label: 'Wide' },
              ].map((wOpt) => (
                <button
                  key={wOpt.id}
                  type="button"
                  onClick={() => updatePreference('contentWidth', wOpt.id)}
                  aria-pressed={prefs.contentWidth === wOpt.id}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                    prefs.contentWidth === wOpt.id
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {wOpt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reading Focus & Bionic Anchors */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-900 dark:text-white">
                  Reading Anchor Treatment (Bionic-Style)
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Visually anchors word beginnings to assist saccadic eye movement and focus
                </p>
              </div>
              <input
                type="checkbox"
                id="reading-focus-toggle"
                checked={prefs.readingFocusTreatment}
                onChange={(e) => updatePreference('readingFocusTreatment', e.target.checked)}
                className="w-5 h-5 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-900 dark:text-white">
                  Dyslexia-Friendly Typography
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Enhanced bottom-weighted character spacing to prevent letter confusion
                </p>
              </div>
              <input
                type="checkbox"
                id="dyslexia-font-toggle"
                checked={prefs.dyslexiaFont}
                onChange={(e) => updatePreference('dyslexiaFont', e.target.checked)}
                className="w-5 h-5 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-900 dark:text-white">
                  Reduced Motion
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Disables animations and transitions for vestibular safety
                </p>
              </div>
              <input
                type="checkbox"
                id="reduced-motion-toggle"
                checked={prefs.reducedMotion}
                onChange={(e) => updatePreference('reducedMotion', e.target.checked)}
                className="w-5 h-5 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <button
            type="button"
            onClick={resetPreferences}
            className="inline-flex items-center text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
            Reset to Defaults
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg text-white bg-brand-600 hover:bg-brand-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
