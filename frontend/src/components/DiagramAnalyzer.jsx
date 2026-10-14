import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, FileText, Check, AlertCircle, Copy, Download, Trash2, Layers, Compass, Eye, Volume2 } from 'lucide-react';
import { apiClient } from '../api/client';
import LoadingState from './LoadingState';
import ErrorMessage from './ErrorMessage';
import SpeechControls from './SpeechControls';
import { copyToClipboard, downloadAccessibleDocument } from '../utils/accessibility';

export default function DiagramAnalyzer() {
  const [file, setFile] = useState(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState(null);
  const [isPdf, setIsPdf] = useState(false);
  const [pdfMeta, setPdfMeta] = useState(null);
  const [selectedPage, setSelectedPage] = useState(1);
  const [detailLevel, setDetailLevel] = useState('balanced');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'entities' | 'chart' | 'reading_order' | 'detailed'

  const fileInputRef = useRef(null);

  const handleFileChange = async (selectedFile) => {
    if (!selectedFile) return;

    setError(null);
    setResult(null);
    setPdfMeta(null);

    // Client-side quick bounds check (5 MiB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File exceeds 5 MiB maximum upload limit. Please select a smaller file.');
      return;
    }

    const isPdfFile = selectedFile.type === 'application/pdf' || selectedFile.name.toLowerCase().endsWith('.pdf');
    const isImageFile = selectedFile.type.startsWith('image/') || /\.(png|jpe?g)$/i.test(selectedFile.name);

    if (!isPdfFile && !isImageFile) {
      setError('Unsupported file type. Only JPEG, PNG, and PDF educational files are supported.');
      return;
    }

    setFile(selectedFile);
    setIsPdf(isPdfFile);

    if (isImageFile) {
      const preview = URL.createObjectURL(selectedFile);
      setFilePreviewUrl(preview);
    } else {
      setFilePreviewUrl(null);
      // Inspect PDF pages
      try {
        setLoading(true);
        const inspection = await apiClient.inspectPdf(selectedFile);
        setPdfMeta(inspection);
        setSelectedPage(1);
      } catch (err) {
        setError(err.message || 'Failed to inspect PDF structure.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await apiClient.explainDiagram({
        file,
        detailLevel,
        pageNumber: isPdf ? selectedPage : 1,
      });
      setResult(data);
    } catch (err) {
      setError(err.message || 'An error occurred while analyzing the diagram.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setFilePreviewUrl(null);
    setIsPdf(false);
    setPdfMeta(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCopy = async () => {
    if (!result) return;
    const fullText = `# ${result.short_summary}\n\n## Overview\n${result.overview}\n\n## Layout\n${result.layout_description}\n\n## Logical Reading Order\n${result.logical_reading_order.join('\n')}\n\n## Detailed Explanation\n${result.detailed_explanation}`;
    const success = await copyToClipboard(fullText);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const content = `# EduAccess AI — Accessible Diagram Explanation
Visual Type: ${result.visual_type}
Short Summary: ${result.short_summary}

## 1. Executive Overview
${result.overview}

## 2. Spatial Layout & Visual Regions
${result.layout_description}

## 3. Main Entities and Labels
${result.main_objects_and_labels.map((o) => `- ${o}`).join('\n')}

## 4. Connections & Directional Flows
${result.relationships_and_flows.map((r) => `- ${r}`).join('\n')}

${result.chart_data ? `## 5. Chart Data & Trends\n- X-Axis: ${result.chart_data.x_axis_label || 'N/A'}\n- Y-Axis: ${result.chart_data.y_axis_label || 'N/A'}\n- Observed Data Points:\n${result.chart_data.observed_data_points.map((p) => `  * ${p}`).join('\n')}\n- Inferred Trends:\n${result.chart_data.inferred_trends.map((t) => `  * ${t}`).join('\n')}\n` : ''}

## 6. Recommended Logical Reading Order
${result.logical_reading_order.map((step, idx) => `${idx + 1}. ${step}`).join('\n')}

## 7. Audio Narration Script
${result.audio_friendly_narration}

## 8. Detailed Academic Concepts
${result.detailed_explanation}

${result.uncertainties_or_unclear_elements.length > 0 ? `## 9. Uncertainties / Unclear Elements\n${result.uncertainties_or_unclear_elements.map((u) => `- ${u}`).join('\n')}` : ''}
`;
    downloadAccessibleDocument(`accessible_diagram_explanation.md`, content);
  };

  return (
    <div className="space-y-6">
      {/* File Ingestion Card */}
      <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm card-panel">
        <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2 flex items-center">
          <Layers className="w-5 h-5 text-brand-600 dark:text-brand-400 mr-2" aria-hidden="true" />
          Upload Educational Diagram or Document
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Upload scientific illustrations, flowcharts, architectural schematics, bar/line charts, or PDF lecture notes (max 5 MiB).
        </p>

        {/* Drag and Drop Zone */}
        {!file ? (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            aria-label="Upload educational image or PDF. Drag and drop or press Enter to browse files."
            className="border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-brand-500 dark:hover:border-brand-400 rounded-xl p-8 text-center cursor-pointer transition-colors bg-slate-50 dark:bg-slate-900/40 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,application/pdf"
              onChange={(e) => handleFileChange(e.target.files[0])}
              className="hidden"
            />
            <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" aria-hidden="true" />
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Drag & drop educational diagram here, or <span className="text-brand-600 dark:text-brand-400 underline">browse files</span>
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Supports PNG, JPEG, and PDF documents (max 5 MiB, up to 15 PDF pages)
            </p>
          </div>
        ) : (
          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-brand-100 dark:bg-brand-900 text-brand-600 dark:text-brand-300 flex items-center justify-center font-bold">
                {isPdf ? <FileText className="w-5 h-5" aria-hidden="true" /> : <ImageIcon className="w-5 h-5" aria-hidden="true" />}
              </div>
              <div>
                <span className="font-semibold text-sm text-slate-900 dark:text-white block">
                  {file.name}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {(file.size / 1024).toFixed(1)} KB • {isPdf ? 'PDF Document' : 'Raster Image'}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleClear}
                aria-label="Remove uploaded file"
                className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
                Remove
              </button>
            </div>
          </div>
        )}

        {/* PDF Page Selection if Multipage */}
        {isPdf && pdfMeta && pdfMeta.total_pages > 1 && (
          <div className="mt-4 p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900">
            <label htmlFor="pdf-page-select" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
              Select Page for Multimodal Visual Analysis ({pdfMeta.total_pages} total pages):
            </label>
            <div className="flex items-center space-x-3">
              <select
                id="pdf-page-select"
                value={selectedPage}
                onChange={(e) => setSelectedPage(parseInt(e.target.value, 10))}
                className="p-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {pdfMeta.pages.map((p) => (
                  <option key={p.page_number} value={p.page_number}>
                    Page {p.page_number} {p.has_images ? '(Contains Visuals/Diagrams)' : ''}
                  </option>
                ))}
              </select>
              <span className="text-xs text-slate-500 dark:text-slate-400 italic">
                {pdfMeta.pages.find((p) => p.page_number === selectedPage)?.preview_snippet.slice(0, 80)}...
              </span>
            </div>
          </div>
        )}

        {/* Image Preview */}
        {filePreviewUrl && (
          <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-900 rounded-xl flex justify-center">
            <img
              src={filePreviewUrl}
              alt="Uploaded educational material preview"
              className="max-h-60 rounded-lg object-contain border border-slate-200 dark:border-slate-800"
            />
          </div>
        )}

        {/* Detail Level & Action */}
        {file && (
          <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <label htmlFor="diagram-detail-select" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Explanation Depth:
              </label>
              <select
                id="diagram-detail-select"
                value={detailLevel}
                onChange={(e) => setDetailLevel(e.target.value)}
                className="p-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="concise">Concise (Quick screen-reader summary & primary labels)</option>
                <option value="balanced">Balanced (Spatial layout, flow sequences & trends)</option>
                <option value="comprehensive">Comprehensive (Exhaustive academic deconstruction)</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleAnalyze}
              disabled={loading}
              className="inline-flex items-center px-6 py-2.5 text-sm font-semibold rounded-xl text-white bg-brand-600 hover:bg-brand-700 shadow-md hover:shadow-lg disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
            >
              <Eye className="w-4 h-4 mr-2" aria-hidden="true" />
              {loading ? 'Analyzing Visuals...' : 'Explain Diagram Accessibly'}
            </button>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && <LoadingState message="Analyzing visual diagram components..." subtext="Deconstructing spatial zones, label hierarchies, and generating audio narration" />}

      {/* Error Feedback */}
      <ErrorMessage message={error} onDismiss={() => setError(null)} />

      {/* Structured Result Display */}
      {result && (
        <div className="space-y-6" role="region" aria-label="Accessible Diagram Explanation Output">
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm card-panel">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-brand-100 text-brand-800 dark:bg-brand-900 dark:text-brand-200 uppercase accent-badge">
                {result.visual_type}
              </span>
              {result.is_mock && (
                <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  Honest Test Fallback Mode
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleCopy}
                aria-label="Copy diagram explanation"
                className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {copied ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5 mr-1" aria-hidden="true" />}
                {copied ? 'Copied' : 'Copy'}
              </button>

              <button
                type="button"
                onClick={handleDownload}
                aria-label="Download accessible explanation as Markdown"
                className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 hover:bg-brand-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <Download className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
                Download Markdown
              </button>
            </div>
          </div>

          {/* Audio Friendly Narration with TTS */}
          <SpeechControls textToRead={result.audio_friendly_narration} label="Listen to Audio-Friendly Visual Narration" />

          {/* Quick Summary Callout */}
          <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/90 rounded-2xl border border-blue-200 dark:border-slate-700 shadow-sm card-panel">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-400 block mb-1">
              Alt-Text & Quick Summary
            </span>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              {result.short_summary}
            </p>
          </div>

          {/* View Switcher Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
            {[
              { id: 'overview', label: 'Overview & Layout', icon: Compass },
              { id: 'entities', label: 'Entities & Flow Sequences', icon: Layers },
              { id: 'chart', label: 'Chart Data & Trends', icon: FileText },
              { id: 'reading_order', label: 'Logical Reading Order', icon: Check },
              { id: 'detailed', label: 'Academic Concepts', icon: Eye },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  aria-pressed={activeTab === tab.id}
                  className={`inline-flex items-center px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                    activeTab === tab.id
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content Panels */}
          {activeTab === 'overview' && (
            <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm card-panel space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                  Executive Visual Overview
                </h4>
                <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                  {result.overview}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                  Spatial Layout & Visual Architecture
                </h4>
                <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                  {result.layout_description}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'entities' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm card-panel">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                  Identified Entities & Labels
                </h4>
                <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                  {result.main_objects_and_labels.map((obj, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-brand-600 dark:text-brand-400 mr-2 font-bold">•</span>
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm card-panel">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                  Directional Relationships & Flows
                </h4>
                <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                  {result.relationships_and_flows.map((rel, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-brand-600 dark:text-brand-400 mr-2 font-bold">→</span>
                      <span>{rel}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'chart' && (
            <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm card-panel space-y-4">
              {result.chart_data ? (
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                    Chart Axes & Trend Analysis
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-xs">
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                      <span className="font-semibold block text-slate-500">Horizontal (X-Axis):</span>
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{result.chart_data.x_axis_label || 'Unlabeled / Categorical'}</span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                      <span className="font-semibold block text-slate-500">Vertical (Y-Axis):</span>
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{result.chart_data.y_axis_label || 'Unlabeled / Values'}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h5 className="text-xs font-bold uppercase text-slate-500 mb-1">Directly Observed Data Points:</h5>
                      <ul className="list-disc list-inside space-y-1 text-sm text-slate-700 dark:text-slate-300">
                        {result.chart_data.observed_data_points.map((pt, idx) => (
                          <li key={idx}>{pt}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                      <h5 className="text-xs font-bold uppercase text-brand-600 dark:text-brand-400 mb-1">Inferred Analytical Trends:</h5>
                      <ul className="list-disc list-inside space-y-1 text-sm text-slate-700 dark:text-slate-300">
                        {result.chart_data.inferred_trends.map((tr, idx) => (
                          <li key={idx}>{tr}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                  This visual is a conceptual schematic or flowchart rather than a coordinate-based quantitative chart.
                </p>
              )}

              {result.mathematical_elements && result.mathematical_elements.length > 0 && (
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                    Mathematical Elements & Formulas
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-slate-700 dark:text-slate-300">
                    {result.mathematical_elements.map((math, idx) => (
                      <li key={idx}>{math}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reading_order' && (
            <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm card-panel">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                Recommended Screen-Reader Navigation Order
              </h4>
              <ol className="space-y-3">
                {result.logical_reading_order.map((step, idx) => (
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

          {activeTab === 'detailed' && (
            <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm card-panel">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                Detailed Academic Explanation
              </h4>
              <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                {result.detailed_explanation}
              </p>
            </div>
          )}

          {/* Uncertainty Callout */}
          {result.uncertainties_or_unclear_elements && result.uncertainties_or_unclear_elements.length > 0 && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border-l-4 border-amber-500 rounded-r-lg text-xs text-amber-900 dark:text-amber-200">
              <span className="font-bold block mb-1">Uncertainties & Resolution Notes:</span>
              <ul className="list-disc list-inside space-y-1">
                {result.uncertainties_or_unclear_elements.map((unc, idx) => (
                  <li key={idx}>{unc}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
