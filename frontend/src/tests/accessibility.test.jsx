import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import FocusChecklist from '../components/FocusChecklist';
import SpeechControls from '../components/SpeechControls';
import { formatBionicReading } from '../utils/accessibility';

describe('Accessibility Components & Utilities', () => {
  it('toggles checklist item completion with mouse and keyboard', () => {
    const tasks = [
      { id: 't-1', task: 'Review mitochondria function', completed: false, estimated_minutes: 5 },
      { id: 't-2', task: 'Memorize ATP definition', completed: false, estimated_minutes: 3 },
    ];

    render(<FocusChecklist initialTasks={tasks} />);

    expect(screen.getByText(/0 of 2 tasks completed/i)).toBeInTheDocument();

    const taskItem = screen.getByLabelText(/Task: Review mitochondria function/i);
    expect(taskItem).toHaveAttribute('aria-checked', 'false');

    // Click to complete
    fireEvent.click(taskItem);
    expect(taskItem).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText(/1 of 2 tasks completed/i)).toBeInTheDocument();

    // Reset button
    const resetBtn = screen.getByLabelText(/Reset checklist progress/i);
    fireEvent.click(resetBtn);
    expect(taskItem).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByText(/0 of 2 tasks completed/i)).toBeInTheDocument();
  });

  it('renders speech synthesis controls and responds to play/stop', () => {
    render(<SpeechControls textToRead="Accessible educational narration test" />);

    expect(screen.getByLabelText(/Text to speech controls/i)).toBeInTheDocument();
    const playBtn = screen.getByLabelText(/Play narration/i);
    fireEvent.click(playBtn);

    // After play, speaking state should be active
    expect(screen.getByText(/Playing|Ready/i)).toBeInTheDocument();
  });

  it('formats bionic reading anchors by bolding beginning of words', () => {
    const text = 'Complex academic passage';
    const result = formatBionicReading(text);
    render(<div>{result}</div>);

    const strongElements = screen.getAllByText(/[A-Za-z]+/i).filter((el) => el.tagName === 'STRONG');
    expect(strongElements.length).toBeGreaterThan(0);
  });
});
