import { useState, useEffect } from 'react';

const STORAGE_KEY = 'eduaccess_a11y_prefs';

const DEFAULT_PREFERENCES = {
  fontSize: 'standard', // 'standard' (100%), 'large' (125%), 'xlarge' (150%)
  lineSpacing: 'normal', // 'normal' (1.6), 'relaxed' (1.8), 'loose' (2.0)
  contentWidth: 'standard', // 'standard' (5xl), 'focused' (3xl for ADHD/Dyslexia), 'wide' (7xl)
  theme: 'light', // 'light', 'high-contrast', 'dark'
  reducedMotion: false,
  dyslexiaFont: false,
  readingFocusTreatment: false, // Bionic visual anchors
  speechRate: 1.0, // 0.75, 1.0, 1.25, 1.5
};

export function useAccessibilityPreferences() {
  const [prefs, setPrefs] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Could not read accessibility preferences from storage:', e);
    }

    // Auto-detect system reduced-motion if available
    const systemReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    return { ...DEFAULT_PREFERENCES, reducedMotion: systemReducedMotion };
  });

  // Apply visual classes to HTML root element
  useEffect(() => {
    const root = document.documentElement;

    // 1. Theme classes
    root.classList.remove('theme-high-contrast', 'dark');
    if (prefs.theme === 'high-contrast') {
      root.classList.add('theme-high-contrast');
    } else if (prefs.theme === 'dark') {
      root.classList.add('dark');
    }

    // 2. Reduced motion
    if (prefs.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }

    // 3. Dyslexia font
    if (prefs.dyslexiaFont) {
      root.classList.add('font-dyslexic');
    } else {
      root.classList.remove('font-dyslexic');
    }

    // 4. Save to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch (e) {
      console.warn('Could not persist preferences:', e);
    }
  }, [prefs]);

  const updatePreference = (key, value) => {
    setPrefs((prev) => ({ ...prev, [key]: value }));
  };

  const resetPreferences = () => {
    setPrefs(DEFAULT_PREFERENCES);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
  };

  return {
    prefs,
    updatePreference,
    resetPreferences,
  };
}
