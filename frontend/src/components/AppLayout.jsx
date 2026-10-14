import React, { useState } from 'react';
import { BookOpen, Image as ImageIcon, Globe, ShieldCheck, Sliders, Menu, X, LayoutDashboard } from 'lucide-react';
import AccessibilitySettings from './AccessibilitySettings';

export default function AppLayout({ currentTab, onNavigateTo, prefs, updatePreference, resetPreferences, children }) {
  const [a11yOpen, setA11yOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Derive container width style
  const containerWidthClass = {
    standard: 'max-w-5xl',
    focused: 'max-w-3xl',
    wide: 'max-w-7xl',
  }[prefs.contentWidth || 'standard'];

  // Derive font scaling style
  const fontScaleClass = {
    standard: 'text-base',
    large: 'text-lg',
    xlarge: 'text-xl',
  }[prefs.fontSize || 'standard'];

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'diagram', label: 'Diagram Explainer', icon: ImageIcon },
    { id: 'text', label: 'Text Simplifier', icon: BookOpen },
    { id: 'url', label: 'Web Article Reader', icon: Globe },
    { id: 'privacy', label: 'Privacy & Security', icon: ShieldCheck },
  ];

  return (
    <div className={`min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 ${fontScaleClass}`}>
      {/* Skip to Main Content Link (WCAG 2.4.1) */}
      <a href="#main-content" className="skip-to-content focus:outline-none focus:ring-2 focus:ring-white">
        Skip to main learning content
      </a>

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand */}
          <div
            onClick={() => onNavigateTo('dashboard')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') onNavigateTo('dashboard'); }}
            aria-label="EduAccess AI Home"
            className="flex items-center space-x-3 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500 rounded-lg p-1"
          >
            <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold shadow-md">
              <BookOpen className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white block leading-tight">
                EduAccess <span className="text-brand-600 dark:text-brand-400">AI</span>
              </span>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 block -mt-0.5">
                Learn Without Barriers
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav aria-label="Main Navigation" className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigateTo(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`inline-flex items-center px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                    isActive
                      ? 'bg-brand-50 dark:bg-brand-950/70 text-brand-700 dark:text-brand-300'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-1.5" aria-hidden="true" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Accessibility Settings Trigger */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setA11yOpen(true)}
              aria-label="Open accessibility and contrast settings"
              className="inline-flex items-center px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-50 dark:bg-slate-800 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-slate-700 hover:bg-brand-100 dark:hover:bg-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <Sliders className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
              <span className="hidden sm:inline">Accessibility Controls</span>
              <span className="sm:hidden">A11y</span>
            </button>

            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Nav */}
        {mobileMenuOpen && (
          <nav aria-label="Mobile Navigation" className="md:hidden p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onNavigateTo(item.id);
                    setMobileMenuOpen(false);
                  }}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full flex items-center px-4 py-2.5 text-sm font-semibold rounded-lg text-left ${
                    isActive
                      ? 'bg-brand-600 text-white'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-3" aria-hidden="true" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        )}
      </header>

      {/* Main Content Area */}
      <main id="main-content" role="main" tabIndex="-1" className={`flex-1 mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full ${containerWidthClass}`}>
        {children}
      </main>

      {/* Accessible Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-500 dark:text-slate-400 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-slate-700 dark:text-slate-300">
              EduAccess AI — Learn Without Barriers
            </p>
            <p className="mt-1">
              Built for Prompt Wars Hackathon (Accessibility & Inclusive Communities). Compliant with WCAG 2.2 AA guidelines.
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={() => onNavigateTo('privacy')}
              className="hover:underline focus:outline-none focus:ring-2 focus:ring-brand-500 rounded"
            >
              Privacy & Data Minimization
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setA11yOpen(true)}
              className="hover:underline focus:outline-none focus:ring-2 focus:ring-brand-500 rounded"
            >
              Adjust Preferences
            </button>
          </div>
        </div>
      </footer>

      {/* Accessibility Settings Modal */}
      <AccessibilitySettings
        isOpen={a11yOpen}
        onClose={() => setA11yOpen(false)}
        prefs={prefs}
        updatePreference={updatePreference}
        resetPreferences={resetPreferences}
      />
    </div>
  );
}
