import React, { useState } from 'react';
import AppLayout from './components/AppLayout';
import Dashboard from './components/Dashboard';
import DiagramAnalyzer from './components/DiagramAnalyzer';
import TextSimplifier from './components/TextSimplifier';
import PrivacyPanel from './components/PrivacyPanel';
import { useAccessibilityPreferences } from './hooks/useAccessibilityPreferences';

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const { prefs, updatePreference, resetPreferences } = useAccessibilityPreferences();

  const handleClearAllSessionData = () => {
    resetPreferences();
    window.location.reload();
  };

  return (
    <AppLayout
      currentTab={currentTab}
      onNavigateTo={setCurrentTab}
      prefs={prefs}
      updatePreference={updatePreference}
      resetPreferences={resetPreferences}
    >
      {currentTab === 'dashboard' && <Dashboard onNavigateTo={setCurrentTab} />}
      {currentTab === 'diagram' && <DiagramAnalyzer />}
      {currentTab === 'text' && <TextSimplifier readingFocusTreatment={prefs.readingFocusTreatment} />}
      {currentTab === 'url' && <TextSimplifier readingFocusTreatment={prefs.readingFocusTreatment} />}
      {currentTab === 'privacy' && <PrivacyPanel onClearAllData={handleClearAllSessionData} />}
    </AppLayout>
  );
}
