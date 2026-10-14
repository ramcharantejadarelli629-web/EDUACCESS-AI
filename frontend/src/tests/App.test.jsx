import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import App from '../App';

// Mock API client
vi.mock('../api/client', () => ({
  apiClient: {
    checkReadiness: vi.fn().mockResolvedValue({
      status: 'ready',
      ai_configured: false,
      mock_ai_mode: true,
      environment: 'test',
      model: 'gemini-2.5-flash',
    }),
    checkLiveness: vi.fn().mockResolvedValue({ status: 'alive' }),
    simplifyText: vi.fn().mockResolvedValue({
      concise_summary: 'Photosynthesis converts light to chemical energy.',
      simplified_explanation: 'Plants use solar photons to create glucose.',
      reading_level: 'standard',
      key_concepts: ['Chloroplasts', 'Calvin Cycle'],
      essential_facts: ['Produces oxygen and glucose'],
      step_by_step_processes: ['Step 1: Light absorption', 'Step 2: Carbon fixation'],
      glossary: [{ term: 'RuBisCO', definition: 'Carbon fixing enzyme', simplified_context: 'Crucial for plant sugar production' }],
      study_checklist: [{ id: 't-1', task: 'Review Calvin cycle', completed: false, estimated_minutes: 5 }],
      comprehension_questions: [{
        id: 'q-1',
        question: 'Where do light reactions occur?',
        options: ['Thylakoid membrane', 'Mitochondria'],
        correct_index: 0,
        explanation: 'They occur in thylakoid membranes.',
      }],
      formulas_and_relationships: ['6CO2 + 6H2O -> C6H12O6 + 6O2'],
      ambiguities_or_warnings: [],
      word_count_original: 50,
      word_count_simplified: 30,
      is_mock: true,
    }),
  },
}));

describe('EduAccess AI Frontend Application', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders the application shell, brand name, and skip link', () => {
    render(<App />);
    expect(screen.getAllByText(/EduAccess/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Learn Without Barriers/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/Skip to main learning content/i)).toBeInTheDocument();
  });

  it('navigates to Text Simplifier when clicked', async () => {
    render(<App />);
    const textNavBtn = screen.getAllByText(/Simplify Academic Text/i)[0];
    fireEvent.click(textNavBtn);

    expect(screen.getByLabelText(/Educational Content to Simplify/i)).toBeInTheDocument();
    expect(screen.getByText(/Transform & Simplify Material/i)).toBeInTheDocument();
  });

  it('opens and closes accessibility settings modal', () => {
    render(<App />);
    const a11yBtn = screen.getByLabelText(/Open accessibility and contrast settings/i);
    fireEvent.click(a11yBtn);

    expect(screen.getByText(/Personalized Accessibility Settings/i)).toBeInTheDocument();

    const closeBtn = screen.getByLabelText(/Close accessibility settings/i);
    fireEvent.click(closeBtn);

    expect(screen.queryByText(/Personalized Accessibility Settings/i)).not.toBeInTheDocument();
  });

  it('loads sample text and submits simplification form', async () => {
    render(<App />);
    const textNavBtn = screen.getAllByText(/Simplify Academic Text/i)[0];
    fireEvent.click(textNavBtn);

    const sampleBtn = screen.getByText(/Load Sample Material/i);
    fireEvent.click(sampleBtn);

    const submitBtn = screen.getByText(/Transform & Simplify Material/i);
    fireEvent.click(submitBtn);

    // Verify simplified results appear
    expect(await screen.findByText(/Photosynthesis converts light to chemical energy/i)).toBeInTheDocument();
    expect(screen.getByText(/Actionable Study Checklist/i)).toBeInTheDocument();
  });
});
