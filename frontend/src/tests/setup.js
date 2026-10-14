import '@testing-library/jest-dom';

// Mock window.matchMedia for responsive and reduced motion queries
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock Web Speech API (window.speechSynthesis)
const mockSpeechSynthesis = {
  speaking: false,
  paused: false,
  pending: false,
  speak: function (utterance) {
    this.speaking = true;
    if (utterance.onstart) utterance.onstart();
    setTimeout(() => {
      this.speaking = false;
      if (utterance.onend) utterance.onend();
    }, 50);
  },
  cancel: function () {
    this.speaking = false;
    this.paused = false;
  },
  pause: function () {
    this.paused = true;
  },
  resume: function () {
    this.paused = false;
  },
  getVoices: function () {
    return [
      { name: 'Alex', lang: 'en-US', default: true },
      { name: 'Victoria', lang: 'en-GB', default: false },
    ];
  },
  addEventListener: () => {},
  removeEventListener: () => {},
};

Object.defineProperty(window, 'speechSynthesis', {
  writable: true,
  value: mockSpeechSynthesis,
});

class MockSpeechSynthesisUtterance {
  constructor(text) {
    this.text = text || '';
    this.rate = 1;
    this.pitch = 1;
    this.volume = 1;
    this.voice = null;
    this.onstart = null;
    this.onend = null;
    this.onerror = null;
  }
}

global.SpeechSynthesisUtterance = MockSpeechSynthesisUtterance;

// Mock Clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: async () => {},
  },
});
