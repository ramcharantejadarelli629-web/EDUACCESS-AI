# EduAccess AI — Learn Without Barriers

> **Prompt Wars — Accessibility & Inclusive Communities**  
> *Transform complex learning materials into accessible, understandable, and actionable learning experiences without losing the meaning of the original content.*

[![FastAPI](https://img.shields.io/badge/FastAPI-0.143.0-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com)
[![Google GenAI SDK](https://img.shields.io/badge/Google_GenAI_SDK-2.30.1-4285F4.svg?logo=google)](https://github.com/googleapis/python-genai)
[![React](https://img.shields.io/badge/React-18.3.1-61DAFB.svg?logo=react)](https://react.dev)
[![WCAG 2.2 AA](https://img.shields.io/badge/WCAG-2.2_AA_Targeted-green.svg)](https://www.w3.org/WAI/standards-guidelines/wcag/)
[![Tests](https://img.shields.io/badge/Pytest-18%20Passed-brightgreen.svg)](https://pytest.org)

---

## 1. Project Overview & Problem Statement

### The Problem
Academic textbooks, scientific papers, lecture slides, and online educational resources are frequently published in formats that present severe barriers to learners:
- **Dense Academic Syntax**: Long multi-clause sentences, passive voice, and uncontextualized jargon create immense cognitive load for students with **dyslexia**, **ADHD**, or English-language learners.
- **Inaccessible Visual Diagrams**: Complex flowcharts, anatomical schematics, graphs, and architectural diagrams often lack descriptive alternative text, leaving visually impaired and screen-reader students completely excluded from visual explanations.
- **Cognitive Overwhelm**: Multipage academic chapters lack bite-sized, actionable study goals, resulting in executive function exhaustion for neurodivergent learners.
- **Insecure / Cluttered Web Sources**: Online educational articles contain extraneous advertisements, scripts, trackers, and inaccessible layouts.

### The Solution: EduAccess AI
**EduAccess AI** is an inclusive educational dashboard that transforms difficult learning materials into structured, accessible, multi-sensory experiences:
1. **Multimodal Diagram Explainer**: Inspects images and PDF pages, generating spatial zone descriptions, entity relationships, chart trend analyses, screen-reader reading sequences, and flowing audio narration scripts.
2. **Cognitive Text Simplifier**: Re-articulates academic excerpts into 3 adjustable levels (Simple, Standard, Detailed) while strictly preserving technical integrity, formulas, and safety warnings.
3. **Actionable Study Checklists**: Automatically breaks complex educational material into interactive, keyboard-navigable micro-tasks with completion states.
4. **Safe Educational URL Reader**: Retrieves public educational articles through a defense-in-depth SSRF-protected pipeline without script execution.
5. **Personalized Accessibility Engine**: Features AAA high-contrast styling, font scaling up to 150%, line-spacing controls, reading-column width constraints, optional Bionic-reading anchor treatments, and browser Text-to-Speech (TTS).

---

## 2. Architecture & System Design

```
+-----------------------------------------------------------------------------------+
|                                   USER AGENT                                      |
|  React 18 + Vite + Tailwind CSS + Lucide Icons + Web Speech API (TTS)             |
|  - Skip-to-Content Link       - Personalized Accessibility Drawer (AAA Contrast)  |
|  - Keyboard-Operable Forms    - ARIA Live Announcements & Focus Restoration       |
+-----------------------------------------------------------------------------------+
                                       |
                   HTTP / REST (Reverse Proxy / CORS)
                                       |
+-----------------------------------------------------------------------------------+
|                         FASTAPI ASYNC BACKEND (Python 3.11)                       |
|                                                                                   |
|  [Security Middleware]                                                            |
|  - Rate Limiter (Token / Sliding Window)   - Streaming Request Cap (5 MiB Upload) |
|  - Defensive Security Headers              - Sanitized JSON Error Handlers        |
|                                                                                   |
|  [Routers: /api/v1]                                                               |
|  - /health/liveness & /health/readiness                                           |
|  - /simplify-text                                                                 |
|  - /simplify-url (SSRF Shield: Private IP Block, Rebinding Defense, Stream Cap)   |
|  - /explain-diagram (Multimodal Vision Engine)                                    |
|  - /pdf/inspect (PyMuPDF Safe Page Inspector & Preview)                           |
+-----------------------------------------------------------------------------------+
                                       |
             +-------------------------+-------------------------+
             |                                                   |
+----------------------------+                     +----------------------------+
|   GOOGLE GENAI SERVICE     |                     |  HONEST LOCAL MOCK ENGINE  |
|  - google-genai SDK        |                     |  - Active when API key is  |
|  - Model: gemini-2.5-flash |                     |    missing or in tests     |
|  - Pydantic Schema Bounds  |                     |  - Fully deterministic    |
|  - Anti-Prompt-Injection   |                     |  - Transparently marked    |
+----------------------------+                     +----------------------------+
```

---

## 3. Repository Structure

```
eduaccess-ai/
|-- .env.example                     # Verified environment configuration template
|-- .gitignore                       # Clean Git exclusion rules
|-- Dockerfile                       # Multi-stage container build (non-root user)
|-- docker-compose.yml               # Production container orchestration
|-- requirements.txt                 # Pinned, tested Python backend dependencies
|-- README.md                        # Master engineering & competition guide
|-- .github/
|   `-- workflows/
|       `-- ci.yml                   # Automated GitHub Actions CI workflow
|-- backend/
|   |-- __init__.py
|   |-- config.py                    # Pydantic Settings management
|   |-- main.py                      # FastAPI app, middleware & error handlers
|   |-- dependencies.py              # Dependency injection for test decoupling
|   |-- schemas/
|   |   |-- __init__.py
|   |   |-- requests.py              # Pydantic validation schemas
|   |   `-- responses.py             # Structured output contracts
|   |-- routers/
|   |   |-- __init__.py
|   |   |-- health.py                # Liveness & Readiness monitoring
|   |   `-- accessibility.py         # Text, diagram, PDF & URL endpoints
|   |-- services/
|   |   |-- __init__.py
|   |   |-- gemini_service.py        # google-genai client & honest mock fallback
|   |   |-- image_service.py         # Pillow image validation & EXIF stripper
|   |   |-- pdf_service.py           # PyMuPDF parser & page renderer
|   |   `-- url_service.py           # SSRF-shielded streaming URL reader
|   |-- security/
|   |   |-- __init__.py
|   |   |-- validation.py            # SSRF, IP range checks & streaming bounds
|   |   `-- rate_limit.py            # Sliding-window in-memory rate limiter
|   `-- tests/
|       |-- __init__.py
|       |-- test_health.py           # Health & security headers tests
|       |-- test_security.py         # SSRF, filename traversal & rate limit tests
|       |-- test_accessibility.py    # Media, PDF & text simplification tests
|       `-- test_ai_service.py       # Gemini abstraction & error mapping tests
`-- frontend/
    |-- package.json                 # React, Vite, Tailwind & Vitest dependencies
    |-- vite.config.js               # Dev server & reverse-proxy configuration
    |-- tailwind.config.js           # Design tokens, contrast & dyslexic themes
    |-- postcss.config.js
    |-- index.html                   # Accessible HTML5 template with skip links
    `-- src/
        |-- main.jsx                 # React root renderer
        |-- App.jsx                  # Main application state orchestrator
        |-- index.css                # WCAG focus rings, theme tokens & typography
        |-- api/
        |   `-- client.js            # Unified async REST client
        |-- hooks/
        |   `-- useAccessibilityPreferences.js  # LocalStorage non-sensitive state
        |-- utils/
        |   `-- accessibility.js     # Bionic reading, clipboard & focus traps
        |-- components/
        |   |-- AppLayout.jsx        # Navigation shell, landmarks & responsive bounds
        |   |-- Dashboard.jsx        # Hero, real engine status & feature navigation
        |   |-- DiagramAnalyzer.jsx  # Multimodal visual & PDF page explainer
        |   |-- TextSimplifier.jsx   # Cognitive simplifier & URL extractor
        |   |-- FocusChecklist.jsx   # Keyboard-operable study micro-tasks
        |   |-- SpeechControls.jsx   # Web Speech API narration controller
        |   |-- AccessibilitySettings.jsx # AAA contrast, sizing & motion drawer
        |   |-- PrivacyPanel.jsx     # Trust disclosure & data-minimization notice
        |   |-- LoadingState.jsx     # Accessible ARIA status spinner
        |   `-- ErrorMessage.jsx     # Accessible alert notifications
        `-- tests/
            |-- setup.js             # Vitest test setup (matchMedia & Speech mocks)
            |-- App.test.jsx         # App shell & navigation unit tests
            `-- accessibility.test.jsx # Checklist, TTS & Bionic formatting tests
```

---

## 4. Key Differentiators: Beyond a Generic AI Chatbot

EduAccess AI is purposefully engineered as an **educational accessibility operating system**, not a conversational wrapper:
1. **Multi-Sensory Modality**: Visual learners see spatial layout diagrams; auditory learners listen via rate-controlled speech synthesis; cognitive learners follow sequential reading orders and micro-task checklists.
2. **Uncertainty-Aware Visual Analysis**: Unlike chatbots that hallucinate occluded or unreadable labels, EduAccess AI explicitly categorizes observed data versus inferred trends, flagging ambiguous areas.
3. **Semantic Truth Preservation**: Simplification algorithms are instructed to protect critical scientific laws, chemical equations, mathematical formulas, and safety warnings from being oversimplified.
4. **Active Cognitive Structuring**: Text is not merely condensed into paragraphs—it is decomposed into **Key Concepts**, **Essential Facts**, **Numbered Processes**, an **Academic Glossary**, an **Actionable Study Checklist**, and **Self-Check Comprehension Checks**.
5. **Defense-in-Depth Security**: Real SSRF defenses with IP socket resolution, stream size limits, decompression bomb protection, and anti-prompt-injection isolation.

---

## 5. Security Architecture & Threat Modeling

| Threat Vector | Mitigation Strategy Implemented in EduAccess AI |
| :--- | :--- |
| **SSRF (Server-Side Request Forgery)** | Hostname resolution with `socket.getaddrinfo`. Strict rejection of IPv4/IPv6 private ranges (RFC 1918), loopback (`127.0.0.1`, `::1`), link-local metadata endpoints (`169.254.169.254`, `metadata.google.internal`), and manual validation across every redirect hop. |
| **Decompression Bombs (Zip/Pixel)** | Image dimensions verified via Pillow (`width <= 8000`, `height <= 8000`, total pixels `<= 25,000,000`). Corrupted files rejected before decoding. |
| **Memory Exhaustion (Denial of Service)** | File uploads are streamed chunk-by-chunk in memory (`read_upload_stream_bounded`) with a hard 5 MiB ceiling; connections are aborted before loading full payloads into RAM. |
| **Prompt Injection via Educational Content** | System instructions mandate that all user text, URLs, and image contents are strictly untrusted subject data to be analyzed, never executed as operational directives. |
| **Directory Traversal** | Client-supplied filenames are sanitized via `sanitize_filename`, stripping `..`, directory separators, and control characters. Files are never written to arbitrary server disk paths. |
| **Error Detail & Stack Trace Leaks** | Global FastAPI exception handlers catch all exceptions, returning sanitized JSON messages without internal stack traces, system paths, or library versions. |

---

## 6. WCAG 2.2 Level AA Accessibility Design

- **Perceivable**:
  - Contrast ratios meet and exceed WCAG AA requirements; high-contrast theme achieves WCAG AAA standards (> 7:1 contrast).
  - Alternative text, structured headings (`<h1>`-`<h5>`), and audio-friendly narrations provide parity for non-visual users.
  - Text reflows seamlessly up to 200% zoom without horizontal clipping.
- **Operable**:
  - Complete keyboard operability: all buttons, inputs, checklists, and drawers can be navigated using `Tab`, `Shift+Tab`, `Space`, and `Enter`.
  - Visible focus indicators (`focus-visible:ring-2`) on every interactive element.
  - Skip to main content link bypasses repetitive header navigation.
  - No keyboard traps: modals trap focus while open and restore focus to trigger buttons upon closing (`Escape` supported).
- **Understandable**:
  - Clear, predictable form validation messages with accessible error banners (`role="alert"`).
  - Consistent layout and persistent accessibility preferences.
- **Robust**:
  - Clean semantic HTML5 landmarks (`<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`).
  - Screen-reader announcements powered by `aria-live="polite"` status regions.

---

## 7. Prerequisites

- **Python**: Version 3.11 or newer.
- **Node.js**: Version 18.x, 20.x, or newer LTS release.
- **npm**: Version 9.x or newer.
- **Google Gemini API Key** *(Optional)*: Required for live Gemini processing. If omitted, EduAccess AI runs in **Honest Local Mock Fallback Mode** for seamless offline evaluation.

---

## 8. Installation & Setup Instructions

### Step 1: Clone the Repository
```bash
git clone https://github.com/your-org/eduaccess-ai.git
cd eduaccess-ai
```

### Step 2: Configure Environment Variables
Copy the example environment template:
```bash
cp .env.example .env
```
*(On Windows PowerShell: `Copy-Item .env.example .env`)*

Configure your settings in `.env`:
```ini
# To enable live Google GenAI processing, add your API key:
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash

# For deterministic offline testing / demonstration, leave GEMINI_API_KEY blank.
```

---

### Step 3: Backend Setup & Startup

1. **Create and activate a Python virtual environment**:
   ```bash
   # Windows
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # Linux / macOS
   python3 -m venv venv
   source venv/bin/activate
   ```

2. **Install backend dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Start the FastAPI backend server**:
   ```bash
   python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
   ```

The backend will be live at:
- **API Base**: `http://127.0.0.1:8000`
- **Interactive OpenAPI Documentation**: `http://127.0.0.1:8000/docs`
- **Health Liveness Probe**: `http://127.0.0.1:8000/api/v1/health/liveness`
- **Health Readiness Probe**: `http://127.0.0.1:8000/api/v1/health/readiness`

---

### Step 4: Frontend Setup & Startup

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install frontend dependencies**:
   ```bash
   npm install
   ```

3. **Start the Vite development server**:
   ```bash
   npm run dev
   ```

The web application dashboard will be accessible at:
- **Web App**: `http://localhost:5173`

---

## 9. Running Automated Tests

### Backend Automated Test Suite
From the project root:
```bash
pytest -v
```
*(Executes 18 comprehensive tests covering SSRF security, rate limiting, filename sanitization, error leakage, image/PDF processing, and AI schema validation).*

### Frontend Automated Test Suite
From the `frontend/` directory:
```bash
npm test
```
*(Executes Vitest and React Testing Library tests verifying rendering, navigation, form submissions, accessibility checklist interactions, and speech synthesis mocks).*

### Production Frontend Build
```bash
npm run build
```

---

## 10. Docker Deployment

EduAccess AI includes a fully reproducible, multi-stage, non-root `Dockerfile` and `docker-compose.yml`:

```bash
# Build and start container
docker-compose up --build -d

# View live logs
docker-compose logs -f

# Verify container health
curl -f http://localhost:8000/api/v1/health/liveness
```

---

## 11. Five-Minute Competition Demonstration Script

| Time | Stage | Action & Demonstration Narration |
| :--- | :--- | :--- |
| **0:00 - 0:45** | **Problem & Mission** | Introduce EduAccess AI: "Millions of students face cognitive barriers when confronted with dense academic papers or complex diagrams. EduAccess AI deconstructs educational barriers while preserving technical truth." Highlight the **WCAG AAA Contrast toggle** and **Bionic Reading anchor mode**. |
| **0:45 - 2:00** | **Feature A: Diagram Explainer** | Navigate to *Diagram Explainer*. Upload a biological cell or system architecture image (or select a multipage PDF lecture). Demonstrate how the engine extracts spatial zones, entity relationships, and screen-reader reading order. Click **Play Narration** to showcase the Web Speech API reading the audio-friendly script aloud. |
| **2:00 - 3:30** | **Feature B: Text Simplifier & Checklist** | Switch to *Text Simplifier*. Click **Load Sample Material** (Photosynthesis & Calvin Cycle) and select **Simple** or **Standard** reading level. Highlight how RuBisCO and chemical formulas are preserved while generating an **Actionable Study Checklist** (interactive keyboard ticking) and a **Source-Faithful Comprehension Check**. |
| **3:30 - 4:15** | **Feature C: Safe URL Reader & Security** | Switch to *Safe Educational URL Reader*. Enter an open-access article URL. Explain the **SSRF defense mechanism** (IP address resolution, private subnet blocking, and streaming size limits). |
| **4:15 - 5:00** | **Privacy & Engineering Integrity** | Open the *Trust & Privacy Panel*. Explain zero server document persistence, lack of user profiling, honest local fallback architecture, and containerized deployment readiness. Conclude: "EduAccess AI empowers inclusive learning without barriers." |

---

## 12. Known Limitations & Production Roadmap

- **Browser Speech Synthesis**: Narration relies on the client's Web Speech API (`window.speechSynthesis`). Voice quality and accents depend on the user's operating system voices. (Roadmap: integrate server-side open neural TTS).
- **Process-Local Rate Limiting**: The included rate limiter is in-memory for zero-dependency hackathon demonstrations. (Roadmap: replace with Redis-backed distributed token buckets in multi-cluster deployments).
- **OCR on Scanned Bitmaps**: Scanned PDF pages are converted to high-resolution images for multimodal vision; documents containing heavily degraded handwriting may report higher uncertainty.

---

## 13. License

Developed under the MIT License for educational and inclusive community advancement.
