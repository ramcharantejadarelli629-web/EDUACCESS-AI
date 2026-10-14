import React, { useState } from 'react';
import { BookOpen, Globe, Sparkles, Copy, Download, Check, AlertTriangle, HelpCircle, FileText, ArrowRight } from 'lucide-react';
import { apiClient } from '../api/client';
import LoadingState from './LoadingState';
import ErrorMessage from './ErrorMessage';
import FocusChecklist from './FocusChecklist';
import SpeechControls from './SpeechControls';
import { formatBionicReading, copyToClipboard, downloadAccessibleDocument } from '../utils/accessibility';

const SAMPLE_TEXT = `Photosynthesis is a biological process utilized by plant cells, algae, and certain bacteria to convert light energy into chemical energy stored in glucose. The process takes place inside cellular organelles called chloroplasts, which contain chlorophyll pigments. 

The light-dependent reactions occur within the thylakoid membranes, where photons excite electrons in chlorophyll, hydrolyzing water into diatomic oxygen (O2) and protons. These excited electrons move through an electron transport chain, synthesizing adenosine triphosphate (ATP) and NADPH via chemiosmosis.

Subsequently, the Calvin Cycle (light-independent reactions) occurs in the stroma. Here, the enzyme Ribulose-1,5-bisphosphate carboxylase-oxygenase (RuBisCO) catalyzes carbon fixation, binding atmospheric carbon dioxide into 3-phosphoglycerate, ultimately producing glyceraldehyde 3-phosphate (G3P) for hexose sugar assembly. Critical note: enzyme denaturation occurs rapidly if ambient temperatures exceed 45 degrees Celsius.`;

export default function TextSimplifier({ readingFocusTreatment = false }) {
  const [mode, setMode] = useState('text'); // 'text' | 'url'
  const [inputText, setInputText] = useState('');
  const [inputUrl, setInputUrl] = useState('');
  const [readingLevel, setReadingLevel] = useState('standard');
  const [targetAudience, setTargetAudience] = useState('general_learner');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [focusModeOverride, setFocusModeOverride] = useState(readingFocusTreatment);

  const handleLoadSample = () => {
    if (mode === 'text') {
      setInputText(SAMPLE_TEXT);
    } else {
      setInputUrl('https://en.wikipedia.org/wiki/Photosynthesis');
    }
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setResult(null);
    setSelectedAnswers({});

    try {
      if (mode === 'text') {
        if (!inputText.trim() || inputText.trim().length < 10) {
          throw new Error('Please enter at least 10 characters of educational text.');
        }
        const data = await apiClient.simplifyText({
          text: inputText,
          readingLevel,
          targetAudience,
        });
        setResult(data);
      } else {
        if (!inputUrl.trim() || !inputUrl.startsWith('http')) {
          throw new Error('Please enter a valid HTTP or HTTPS article URL.');
        }
        const data = await apiClient.simplifyUrl({
          url: inputUrl,
          readingLevel,
        });
        setResult(data.simplification);
      }
    } catch (err) {
      setError(err.message || 'An error occurred during text simplification.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    const fullContent = `# ${result.concise_summary}\n\n${result.simplified_explanation}\n\n## Key Concepts\n${result.key_concepts.join('\n- ')}`;
    const success = await copyToClipboard(fullContent);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const content = `# EduAccess AI - Accessible Learning Summary
Applied Reading Level: ${result.reading_level.toUpperCase()}
Generated on: ${new Date().toLocaleDateString()}

## Concise Overview
${result.concise_summary}

## Simplified Explanation
${result.simplified_explanation}

## Key Concepts
${result.key_concepts.map((c) => `- ${c}`).join('\n')}

## Essential Facts (Semantic Retention)
${result.essential_facts.map((f) => `- ${f}`).join('\n')}

## Step-by-Step Processes
${result.step_by_step_processes.map((p, i) => `${i + 1}. ${p}`).join('\n')}

## Academic Glossary
${result.glossary.map((g) => `### ${g.term}\n**Definition**: ${g.definition}\n**Context**: ${g.simplified_context}`).join('\n\n')}

## Formulas & Relationships
${result.formulas_and_relationships.map((f) => `- ${f}`).join('\n')}
`;
    downloadAccessibleDocument(`accessible_summary_${result.reading_level}.md`, content);
  };

  const handleOptionSelect = (qId, optIdx) => {
    setSelectedAnswers((prev) => ({ ...prev, [qId]: optIdx }));
  };

  return (
    <div className="space-y-6">
      {/* Input Mode Selector */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 space-x-4">
        <button
          type="button"
          onClick={() => { setMode('text'); setError(null); }}
          className={`pb-3 font-semibold text-sm flex items-center border-b-2 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 ${
            mode === 'text'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4 mr-2" aria-hidden="true" />
          Paste Academic Text
        </button>

        <button
          type="button"
          onClick={() => { setMode('url'); setError(null); }}
          className={`pb-3 font-semibold text-sm flex items-center border-b-2 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 ${
            mode === 'url'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Globe className="w-4 h-4 mr-2" aria-hidden="true" />
          Safe Educational URL Reader
        </button>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm card-panel">
        <div className="flex justify-between items-center mb-3">
          <label htmlFor={mode === 'text' ? 'educational-text-input' : 'educational-url-input'} className="block font-bold text-sm text-slate-900 dark:text-white">
            {mode === 'text' ? 'Educational Content to Simplify' : 'Public Educational Article URL'}
          </label>
          <button
            type="button"
            onClick={handleLoadSample}
            className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center focus:outline-none focus:ring-2 focus:ring-brand-500 rounded p-1"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
            Load Sample Material
          </button>
        </div>

        {mode === 'text' ? (
          <div>
            <textarea
              id="educational-text-input"
              rows={7}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste textbook excerpts, dense research paragraphs, lecture notes, or complex educational passages..."
              maxLength={25000}
              aria-describedby="text-limit-info"
              className="w-full p-4 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-y"
            />
            <div id="text-limit-info" className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1.5">
              <span>Supports up to 25,000 characters</span>
              <span>{inputText.length} / 25,000</span>
            </div>
          </div>
        ) : (
          <div>
            <input
              id="educational-url-input"
              type="url"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="https://en.wikipedia.org/wiki/Photosynthesis"
              className="w-full p-3.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 flex items-center">
              Protected by SSRF defenses, private IP blocks, and safe streaming parsers.
            </p>
          </div>
        )}

        {/* Configuration Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5 pt-4 border-t border-slate-200 dark:border-slate-700">
          <div>
            <label htmlFor="reading-level-select" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Target Reading Simplification
            </label>
            <select
              id="reading-level-select"
              value={readingLevel}
              onChange={(e) => setReadingLevel(e.target.value)}
              className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="simple">Simple (Plain Language, Short Sentences, Core Metaphors)</option>
              <option value="standard">Standard (Balanced Academic Rigor & Clear Phrasing)</option>
              <option value="detailed">Detailed (Comprehensive Breakdown, Preserving Terminology)</option>
            </select>
          </div>

          <div>
            <label htmlFor="target-audience-select" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Learning Focus Profile
            </label>
            <select
              id="target-audience-select"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="general_learner">General Learner (Clear, Structured)</option>
              <option value="adhd_focus">ADHD Friendly (Bite-sized Steps, Actionable Tasks)</option>
              <option value="dyslexia_support">Dyslexia Support (Clear Typography, High Spacing)</option>
              <option value="audio_learner">Auditory Learner (Optimized for Speech Narration)</option>
            </select>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-5 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-6 py-2.5 text-sm font-semibold rounded-xl text-white bg-brand-600 hover:bg-brand-700 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
          >
            <Sparkles className="w-4 h-4 mr-2" aria-hidden="true" />
            {loading ? 'Processing...' : 'Transform & Simplify Material'}
          </button>
        </div>
      </form>

      {/* Loading State */}
      {loading && <LoadingState message="Analyzing and transforming educational text..." subtext="Extracting glossary terms, study steps, and verifying semantic preservation" />}

      {/* Error Message */}
      <ErrorMessage message={error} onDismiss={() => setError(null)} />

      {/* Results View */}
      {result && (
        <div className="space-y-6" role="region" aria-label="Simplified Learning Output">
          {/* Header Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm card-panel">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-brand-100 text-brand-800 dark:bg-brand-900 dark:text-brand-200 uppercase accent-badge">
                Level: {result.reading_level}
              </span>
              {result.is_mock && (
                <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  Honest Test Fallback Mode
                </span>
              )}
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Original: {result.word_count_original} words → Simplified: {result.word_count_simplified} words
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setFocusModeOverride(!focusModeOverride)}
                aria-pressed={focusModeOverride}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                  focusModeOverride
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600'
                }`}
              >
                Reading Anchors: {focusModeOverride ? 'ON' : 'OFF'}
              </button>

              <button
                type="button"
                onClick={handleCopy}
                aria-label="Copy simplified summary"
                className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {copied ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5 mr-1" aria-hidden="true" />}
                {copied ? 'Copied' : 'Copy'}
              </button>

              <button
                type="button"
                onClick={handleDownload}
                aria-label="Download accessible summary as Markdown"
                className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 hover:bg-brand-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <Download className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
                Download Markdown
              </button>
            </div>
          </div>

          {/* Text-to-Speech Player */}
          <SpeechControls textToRead={`${result.concise_summary}. ${result.simplified_explanation}`} label="Listen to Simplified Explanation" />

          {/* Concise Summary Card */}
          <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/90 rounded-2xl border border-blue-200 dark:border-slate-700 shadow-sm card-panel">
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-400 mb-2">
              Executive Overview
            </h3>
            <p className="text-base text-slate-800 dark:text-slate-100 font-medium leading-relaxed">
              {result.concise_summary}
            </p>
          </div>

          {/* Detailed Accessible Explanation */}
          <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm card-panel">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center">
              <FileText className="w-5 h-5 text-brand-600 dark:text-brand-400 mr-2" aria-hidden="true" />
              Accessible Explanation
            </h3>
            <div className="text-slate-700 dark:text-slate-200 leading-relaxed text-sm">
              {focusModeOverride ? (
                formatBionicReading(result.simplified_explanation)
              ) : (
                result.simplified_explanation.split('\n\n').map((para, idx) => (
                  <p key={idx} className="mb-4">
                    {para}
                  </p>
                ))
              )}
            </div>
          </div>

          {/* Key Concepts & Essential Facts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm card-panel">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center text-brand-600 dark:text-brand-400">
                <Sparkles className="w-4 h-4 mr-2" aria-hidden="true" />
                Key Concepts
              </h4>
              <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                {result.key_concepts.map((concept, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="text-brand-600 dark:text-brand-400 mr-2 font-bold">•</span>
                    <span>{concept}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm card-panel">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-4 h-4 mr-2" aria-hidden="true" />
                Essential Facts (Semantic Retention)
              </h4>
              <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                {result.essential_facts.map((fact, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="text-amber-600 dark:text-amber-400 mr-2 font-bold">✓</span>
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Step-by-Step Processes */}
          {result.step_by_step_processes && result.step_by_step_processes.length > 0 && (
            <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm card-panel">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center">
                <ArrowRight className="w-4 h-4 mr-2 text-brand-600" aria-hidden="true" />
                Step-by-Step Process Breakdown
              </h4>
              <ol className="space-y-3">
                {result.step_by_step_processes.map((step, idx) => (
                  <li key={idx} className="flex items-start text-sm text-slate-700 dark:text-slate-300">
                    <span className="w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-900 text-brand-800 dark:text-brand-200 font-bold text-xs flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="flex-1">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Interactive Academic Glossary */}
          {result.glossary && result.glossary.length > 0 && (
            <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm card-panel">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
                Academic Glossary & Term Definitions
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.glossary.map((item, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-sm text-brand-700 dark:text-brand-400 block mb-1">
                      {item.term}
                    </span>
                    <p className="text-xs text-slate-700 dark:text-slate-300 mb-2">
                      <strong>Definition:</strong> {item.definition}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                      <strong>Context:</strong> {item.simplified_context}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actionable Study Checklist */}
          {result.study_checklist && result.study_checklist.length > 0 && (
            <FocusChecklist initialTasks={result.study_checklist} />
          )}

          {/* Comprehension Questions */}
          {result.comprehension_questions && result.comprehension_questions.length > 0 && (
            <div className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm card-panel">
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center">
                <HelpCircle className="w-5 h-5 text-brand-600 dark:text-brand-400 mr-2" aria-hidden="true" />
                Comprehension Self-Assessment
              </h4>
              <div className="space-y-6">
                {result.comprehension_questions.map((q, qIdx) => {
                  const userAns = selectedAnswers[q.id];
                  const hasAnswered = userAns !== undefined;

                  return (
                    <div key={q.id || qIdx} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                      <p className="font-semibold text-sm text-slate-900 dark:text-white mb-3">
                        {qIdx + 1}. {q.question}
                      </p>
                      <div className="space-y-2">
                        {q.options.map((opt, optIdx) => {
                          let btnStyle = 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100';

                          if (hasAnswered) {
                            if (optIdx === q.correct_index) {
                              btnStyle = 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-semibold';
                            } else if (optIdx === userAns) {
                              btnStyle = 'bg-red-50 dark:bg-red-950/50 border-red-500 text-red-900 dark:text-red-200';
                            } else {
                              btnStyle = 'opacity-50 border-slate-200 dark:border-slate-800';
                            }
                          }

                          return (
                            <button
                              key={optIdx}
                              type="button"
                              onClick={() => handleOptionSelect(q.id, optIdx)}
                              className={`w-full text-left p-3 text-xs rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 ${btnStyle}`}
                            >
                              <span className="font-bold mr-2">{String.fromCharCode(65 + optIdx)}.</span>
                              {opt}
                            </button>
                          );
                        })}
                      </div>

                      {hasAnswered && (
                        <div
                          role="status"
                          aria-live="polite"
                          className="mt-3 p-3 text-xs rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-900"
                        >
                          <strong>Explanation:</strong> {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Warnings & Ambiguities */}
          {result.ambiguities_or_warnings && result.ambiguities_or_warnings.length > 0 && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border-l-4 border-amber-500 rounded-r-lg text-xs text-amber-900 dark:text-amber-200">
              <span className="font-bold block mb-1">Source Ambiguities & Qualifications Noted:</span>
              <ul className="list-disc list-inside space-y-1">
                {result.ambiguities_or_warnings.map((warn, idx) => (
                  <li key={idx}>{warn}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
