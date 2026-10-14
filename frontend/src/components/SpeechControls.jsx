import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Pause, Play, RotateCcw } from 'lucide-react';

export default function SpeechControls({ textToRead, label = 'Listen to Accessible Narration' }) {
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [rate, setRate] = useState(1.0);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const utteranceRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSupported(true);

      const updateVoices = () => {
        const available = window.speechSynthesis.getVoices();
        setVoices(available);
        if (available.length > 0 && !selectedVoice) {
          const defaultVoice = available.find((v) => v.default) || available[0];
          setSelectedVoice(defaultVoice.name);
        }
      };

      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;

      return () => {
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
      };
    }
  }, []);

  const handlePlay = () => {
    if (!supported || !textToRead) return;

    if (paused) {
      window.speechSynthesis.resume();
      setPaused(false);
      setSpeaking(true);
      return;
    }

    window.speechSynthesis.cancel();

    const cleanText = textToRead.replace(/[#*_`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = rate;

    if (selectedVoice) {
      const voiceObj = voices.find((v) => v.name === selectedVoice);
      if (voiceObj) utterance.voice = voiceObj;
    }

    utterance.onstart = () => {
      setSpeaking(true);
      setPaused(false);
    };

    utterance.onend = () => {
      setSpeaking(false);
      setPaused(false);
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis error:', e);
      setSpeaking(false);
      setPaused(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const handlePause = () => {
    if (speaking && !paused) {
      window.speechSynthesis.pause();
      setPaused(true);
      setSpeaking(false);
    }
  };

  const handleStop = () => {
    if (supported) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      setPaused(false);
    }
  };

  if (!supported) {
    return (
      <div className="p-3 text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-lg">
        Text-to-speech is not supported by your current browser.
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-label="Text to speech controls"
      className="p-4 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-xl my-4 card-panel"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <Volume2 className="w-5 h-5 text-brand-600 dark:text-brand-400" aria-hidden="true" />
          <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">
            {label}
          </span>
          <span
            aria-live="polite"
            className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
          >
            {speaking ? 'Playing...' : paused ? 'Paused' : 'Ready'}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {!speaking && !paused ? (
            <button
              type="button"
              onClick={handlePlay}
              aria-label="Play narration"
              className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg text-white bg-brand-600 hover:bg-brand-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <Play className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
              Play
            </button>
          ) : speaking ? (
            <button
              type="button"
              onClick={handlePause}
              aria-label="Pause narration"
              className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <Pause className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
              Pause
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePlay}
              aria-label="Resume narration"
              className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg text-white bg-brand-600 hover:bg-brand-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <Play className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
              Resume
            </button>
          )}

          <button
            type="button"
            onClick={handleStop}
            disabled={!speaking && !paused}
            aria-label="Stop narration"
            className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <VolumeX className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
            Stop
          </button>

          {/* Speed selector */}
          <div className="flex items-center space-x-1 pl-2 border-l border-slate-200 dark:border-slate-700">
            <label htmlFor="tts-speed" className="text-xs text-slate-600 dark:text-slate-400">
              Speed:
            </label>
            <select
              id="tts-speed"
              value={rate}
              onChange={(e) => setRate(parseFloat(e.target.value))}
              aria-label="Adjust reading speed"
              className="text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-1.5 py-1 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="0.75">0.75x</option>
              <option value="1.0">1.0x (Normal)</option>
              <option value="1.25">1.25x</option>
              <option value="1.5">1.5x</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
