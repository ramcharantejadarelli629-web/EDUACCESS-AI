import React from 'react';

/**
 * Transforms plain text into accessible reading-anchor visual elements (Bionic-reading inspired).
 * Bolds the first 40-50% of characters in each word while preserving semantic text.
 */
export function formatBionicReading(text) {
  if (!text) return null;

  const paragraphs = text.split('\n\n');

  return paragraphs.map((para, pIdx) => {
    const words = para.split(' ');
    const formattedWords = words.map((word, wIdx) => {
      if (!word) return ' ';

      // Extract leading or trailing punctuation
      const match = word.match(/^([^a-zA-Z0-9]*)([a-zA-Z0-9]+)([^a-zA-Z0-9]*)$/);
      if (!match) {
        return (
          <span key={`${pIdx}-${wIdx}`}>{word} </span>
        );
      }

      const [, prefix, core, suffix] = match;
      const splitPoint = Math.ceil(core.length * 0.45);
      const boldPart = core.slice(0, splitPoint);
      const restPart = core.slice(splitPoint);

      return (
        <span key={`${pIdx}-${wIdx}`} className="inline">
          {prefix}
          <strong className="font-bold text-inherit">{boldPart}</strong>
          {restPart}
          {suffix}{' '}
        </span>
      );
    });

    return (
      <p key={pIdx} className="mb-4 leading-relaxed">
        {formattedWords}
      </p>
    );
  });
}

/**
 * Safely copy text to user clipboard with visual confirmation.
 */
export async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback for older environments
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);
    return successful;
  } catch (err) {
    console.error('Failed to copy text:', err);
    return false;
  }
}

/**
 * Trigger download of an accessible learning document as Markdown or Plain Text.
 */
export function downloadAccessibleDocument(filename, content, mimeType = 'text/markdown') {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Trap keyboard focus inside a modal dialog according to WCAG 2.4.3.
 */
export function trapModalFocus(event, modalElement) {
  if (event.key !== 'Tab' || !modalElement) return;

  const focusables = modalElement.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  if (focusables.length === 0) return;

  const first = focusables[0];
  const last = focusables[focusables.length - 1];

  if (event.shiftKey) {
    if (document.activeElement === first) {
      last.focus();
      event.preventDefault();
    }
  } else {
    if (document.activeElement === last) {
      first.focus();
      event.preventDefault();
    }
  }
}
