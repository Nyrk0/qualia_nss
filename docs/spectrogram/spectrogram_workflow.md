# Spectrogram Workflow & Sprint Plan

https://chatgpt.com/c/68acc260-149c-8325-a0e8-9c1893172738


**Purpose:** Provide an actionable, sprint-based implementation plan for the refactored Spectrogram Visualizer PRD. This plan is intended for the coding architect to validate, adapt and approve before engineering work begins.

---

## Executive summary

Build a high-performance, browser-based spectrogram visualizer that supports real-time microphone input, file import/export, 2D & 3D visualizations, accurate measurement-mode settings, and robust performance across desktop and mobile browsers. Prioritize audio fidelity, low-latency audio pipeline, clear API for integration/embedding, test coverage and thorough documentation.

---

## Assumptions (to validate)

- Team has familiarity with WebAudio API, AudioWorklet and modern JS/TS toolchains.
- Hosting environment can support Cross-Origin-Opener-Policy and Cross-Origin-Embedder-Policy if SharedArrayBuffer is required.
- Primary target browsers: Chrome (desktop & Android), Firefox, Safari (desktop & iOS) — validate exact browser matrix.
- Project license will be permissive-compatible with Chrome Music Lab reference (confirm if reuse of assets/code needs attribution or different license).

---

## Deliverables

1. Working 2D real-time spectrogram from microphone and file input (demo page).
2. Measurement-mode with controlled mic constraints (autogain off, echo cancellation off) and sample-rate awareness.
3. Low-latency audio pipeline using AudioWorklet or equivalent; FFT implemented in JS.
4. 3D spectrogram view (WebGL) with interactive controls (rotate, zoom, time-scrub).
5. Export features: PNG (image), WAV (recording), CSV (spectrogram matrix), and small WebM capture option.
6. Unit & integration tests, CI pipeline, and performance benchmarks.
7. Documentation: API, embedding guide, design decisions, and `LLM.txt` contextual file for AI-assisted development.

---

## Sprint cadence & sizing

- Sprint length: **1 week** (ideal) or **2 weeks** if team prefers. Plan assumes 1–2 FTE developers.
- Story points: use team’s velocity. Tasks include explicit acceptance criteria and test instructions.

---

## Sprint 0 — Discovery, infra & scaffolding (3–5 days)

**Goals**

- Validate assumptions (browsers, hosting headers, license).
- Create repo skeleton, CI pipeline, eslint/prettier, TypeScript, and testing framework (Jest + Playwright).
- Create `INITIAL.md`, `LLM.txt`, and `workflow.md` files in repo.
- Establish minimal demo page and deploy pipeline (Netlify/Vercel/GH Pages).

**Tasks**

- [ ] Confirm browser support matrix and required polyfills.
- [ ] Confirm hosting constraints for SharedArrayBuffer (COOP/COEP) and decide fallback strategy.
- [ ] Setup repo, TypeScript, bundler (Vite/Parcel/Esbuild), CI (GH Actions), linting.
- [ ] Add code style, commit hooks, PR template with checklist.
- [ ] Create minimal demo page and deploy preview.

**Acceptance criteria**

- PR with repo scaffolding merged.
- Demo page reachable with basic UI shell.
- Tests run in CI.

---

## Sprint 1 — Core audio pipeline + 2D baseline (7–10 days)

**Goals**

- Implement robust audio capture from mic and file input with sample-rate detection and resampling.
- Implement a real-time 2D spectrogram (canvas-based) with configurable FFT size, window, overlap, and dB scaling.

**Tasks**

- [ ] Implement input module:
  - microphone via `getUserMedia` with configurable constraints (AGC, echoCancellation off)
  - file input (WAV/MP3) with decoding via `AudioContext.decodeAudioData` or `AudioWorklet` feed
  - sample-rate awareness and resampling module
- [ ] Implement audio processing module in AudioWorklet or Worker that buffers audio frames and computes FFT.
  - Use an FFT implementation: highly-optimized JS FFT.
  - Expose parameters: fftSize, windowType (hann, hamming, blackman), overlap, hopSize
- [ ] Implement Canvas2D spectrogram renderer
  - rolling waterfall, time axis, frequency axis (linear & log option), dB scaling, color map presets
  - palette presets including colorblind-safe options
- [ ] Add UI controls for parameters, presets, and start/stop

**Acceptance criteria**

- Live mic input produces stable spectrogram with controllable parameters.
- Demo includes file import producing same spectrogram visualization.
- CPU usage is within budget (define budget in Sprint 2 benchmarks).

---

## Sprint 2 — Performance & measurement-mode tuning (7 days)

**Goals**

- Optimize pipeline for low latency and CPU usage.
- Implement measurement-mode with deterministic settings and exportable measurement data.

**Tasks**

- [ ] Move FFT into AudioWorklet/WASM if not already; ensure audio processing runs off main thread.
- [ ] Use `OffscreenCanvas` for rendering in worker where supported.
- [ ] Add configurable buffering and overlap tuning; measure latency and jitter.
- [ ] Add measurement export: CSV of spectrogram matrix, statistical summaries, and timed snapshots.
- [ ] Add instrumentation endpoints for performance logging.

**Acceptance criteria**

- End-to-end latency (mic input to visual update) measured and documented.
- CPU and memory profiling included in CI smoke test.
- Measurement-mode reproducible; exported CSV validated by sample golden file.

---

## Sprint 3 — 3D visualization & interaction (7–10 days)

**Goals**

- Implement interactive 3D spectrogram using Custom WebGL.
- Provide smooth camera controls, time scrubbing, and GPU-accelerated rendering.

**Tasks**

- [ ] Select 3D rendering approach (Custom WebGL; no external libraries).
- [ ] Implement conversion of spectrogram frames into GPU textures and render as a mesh (height/time grid) or texture-based waterfall.
- [ ] Add camera controls (orbit, zoom), UI toggles between 2D/3D, and performance fallback.
- [ ] Implement level-of-detail adjustments and culling to keep frame rate stable.

**Acceptance criteria**

- 3D view renders with interactive controls at target frame rate.
- Fallback to 2D when GPU resources are constrained.

---

## Sprint 4 — Features, export, presets & API (5–7 days)

**Goals**

- Add recording/export (WAV), PNG/CSV export, preset system, and embeddable API.

**Tasks**

- [ ] Implement recording via `MediaRecorder` or direct PCM capture with WAV encoder.
- [ ] Implement PNG export for current view and CSV export for spectrogram matrix.
- [ ] Design and implement `Spectrogram` embeddable component API (constructor options, event hooks for data frames, pause/resume, snapshot).
- [ ] Add preset manager and UI for saving/loading presets.

**Acceptance criteria**

- Exports produce valid files and match the visualized data.
- Embeddable API has documentation and example integrations.

---

## Sprint 5 — Testing, accessibility, cross-browser & QA (7 days)

**Goals**

- Hardening: cross-browser testing, accessibility, unit/integration tests, and performance benchmarks.

**Tasks**

- [ ] Implement Playwright e2e tests for main flows (mic permission flow, file import, exports).
- [ ] Accessibility checks: keyboard navigation, ARIA labels, color contrast, screen-reader hints.
- [ ] Cross-browser verification matrix run and documented. Create known-issues and fallbacks.
- [ ] Add automated performance smoke tests in CI.

**Acceptance criteria**

- CI runs tests and reports performance metrics.
- Known-issues doc with fallback strategies for browsers that lack features.

---

## Sprint 6 — Polish, docs & release (4–6 days)

**Goals**

- Final polish, UX improvements, packaging, publishing, and documentation.

**Tasks**

- [ ] Final UX polish and micro-interactions.
- [ ] Document embedding, API, compatibility, and measurement-mode guidance.
- [ ] Prepare release artifacts (npm package, demo site, example embeds) and CHANGELOG.
- [ ] Plan maintenance and roadmap for v2 features (plugins, ML analysis, mel-spectrogram, chroma features).

**Acceptance criteria**

- Release candidate published and demo site updated with documentation.
- Roadmap for next cycle created.

---

## Risks & mitigation

- **SharedArrayBuffer / Cross-origin isolation**: If team wants highest-performance parallelism, confirm hosting can provide COOP/COEP headers. If not possible, use message-passing + transferable typed arrays and avoid SharedArrayBuffer.
- **Safari limitations**: AudioWorklet and `OffscreenCanvas` support varies — provide robust fallbacks and use feature detection.
- **Mobile CPU/GPU constraints**: Provide a low-power fallback (lower FFT size, lower frame rate, reduce history depth).
- **License compatibility**: Check reuse constraints of Chrome Music Lab assets.

---

## Definition of Done

- Source in repo with CI passing.
- Demo pages for core features (mic + file + export + 3D) running on staging.
- Unit & e2e tests with coverage threshold set by team.
- Performance benchmarks documented and within agreed budgets.

---

## Next steps for the architect (validation checklist)

- [ ] Confirm browser matrix and hosting constraints (COOP/COEP).
- [ ] Approve tech stack (TypeScript, AudioWorklet, Custom WebGL).
- [ ] Approve sprint cadence and sprint sizing (1-week vs 2-week sprints).
- [ ] Identify available engineers and their skills (WebAudio, AudioWorklet, Custom WebGL).


---

*Start of talking about implementation*
we must decide all the following up to clean workflow

## Sprint D0 — Implementation Decision & Approval (3 days)

Goal: lock non-code decisions so engineering can execute Sprints 1–6 without churn. Track decisions inline with explicit approvals and owners.

### Scope of decisions (must be approved in D0)
- [ ] Browser matrix & minimum versions — Owner: Product/Arch — Approver: Eng Lead
- [ ] Hosting & headers (COOP/COEP) — Owner: DevOps — Approver: Arch
- [ ] Performance budgets (latency, FPS, CPU, memory) — Owner: Arch — Approver: PM
- [ ] Tech stack (TS, AudioWorklet, Custom WebGL) — Owner: Eng Lead — Approver: Arch
- [ ] 3D approach (GPU mesh vs textured waterfall) — Owner: Eng Lead — Approver: PM
- [ ] Export specs (WAV bit-depth, CSV schema, PNG metadata) — Owner: Arch — Approver: PM
- [ ] API surface (constructor options, events, methods) — Owner: Eng Lead — Approver: Arch
- [ ] Accessibility level (WCAG target, colorblind palettes) — Owner: PM — Approver: Design
- [ ] Target devices split (desktop vs mobile %) — Owner: PM — Approver: Arch
- [ ] Sprint cadence (1 or 2 weeks) & resourcing — Owner: PM — Approver: Eng Lead

### Deliverables
- Decision Log (below) completed with APPROVED status per item
- PRD updates committed to `docs/spectrogram/spectrogram-prd.md`
- Deployment notes committed to `docs/deployment-workflows.md`
- Backlog tickets created for affected sprints (links recorded here)

### Approval log (source of truth)
- Browser matrix: Chrome 90+, Edge 90+, Firefox 88+, Safari 14+ (iOS 14+) | Status: [x] APPROVED | Date: 2025-08-25 | By: Architect | Link: docs/spectrogram/spectrogram-prd.md §3.3
- COOP/COEP: Enable on managed hosting to allow SAB; maintain no-SAB fallback (transferable buffers) | Status: [x] APPROVED | Date: 2025-08-25 | By: Architect | Link: docs/deployment-workflows.md
- Perf budgets: Desktop ≤60 ms mic→visual; 2D 60 FPS; 3D ≥30 FPS; CPU <25% core; Mem <100 MB. Mobile ≤120 ms; 2D ≥30 FPS; adaptive 3D/fallback | Status: [x] APPROVED | Date: 2025-08-25 | By: Architect | Link: docs/spectrogram/spectrogram-prd.md §3.3
- Tech stack: ES6, Custom WebGL (no libs), AudioWorkletNode, in-worklet JS FFT; zero deps; no build system; OffscreenCanvas when available; AW fallback: ScriptProcessorNode (reduced load) | Status: [x] APPROVED | Date: 2025-08-25 | By: Architect | Link: this doc
- 3D approach: Static 256×256 GPU mesh; data texture [freq×time]; single-row gl.texSubImage2D updates; circular y-offset; normalized UV sampling | Status: [x] APPROVED | Date: 2025-08-25 | By: Eng Lead | Link: docs/spectrogram/spectrogram-prd.md §4.2
- Exports: WAV 32-bit float (option 16-bit); CSV matrix with metadata header; PNG with metadata (fftSize, dB range, timestamp) | Status: [x] APPROVED | Date: 2025-08-25 | By: PM | Link: docs/spectrogram/spectrogram-prd.md §5
- API surface: Constructor options; methods start/stop/setOptions/snapshotPNG/exportCSV/recordWAV; events onFrame/onError/onPerf/onExport | Status: [x] APPROVED | Date: 2025-08-25 | By: Architect | Link: docs/spectrogram/spectrogram-prd.md §7.1
- Accessibility: WCAG 2.1 AA, keyboard control, ARIA labels, colorblind-safe (Cividis) | Status: [x] APPROVED | Date: 2025-08-25 | By: Design | Link: docs/spectrogram/spectrogram-prd.md §5.2
- Devices split: Target 70% desktop / 30% mobile with adaptive defaults | Status: [x] APPROVED | Date: 2025-08-25 | By: PM | Link: this doc
- Cadence & resourcing: 1-week sprints; 1–2 FTE; D0 = 3 days | Status: [x] APPROVED | Date: 2025-08-25 | By: PM | Link: this doc

### Exit criteria
- All items above marked APPROVED (no TBDs)
- Corresponding PRD and workflow docs updated
- Risks created as issues where decisions impose constraints

### Risk notes
- If COOP/COEP cannot be enabled, record fallback (no SharedArrayBuffer; worker comms via transferable buffers) and reduce performance budgets accordingly.

---

## Decision Log — Working Section
(Use this section to paste final approved statements for each decision. Keep concise, one paragraph each. Link to PRs.)

- Browser matrix: Support Chrome 90+, Edge 90+, Firefox 88+, Safari 14+ (iOS 14+). This aligns with AudioWorklet availability and keeps broad coverage. Any gaps will use documented fallbacks. See PR updates to PRD §3.3.
- COOP/COEP: When hosting under our control, enable COOP/COEP to unlock SharedArrayBuffer. We still design without SAB; primary IPC via transferable buffers. Deployment notes capture headers and fallbacks.
- Performance budgets: Desktop: mic→visual ≤60 ms, 2D 60 FPS, 3D ≥30 FPS, CPU <25% single core, memory <100 MB. Mobile: mic→visual ≤120 ms, 2D ≥30 FPS, adaptive 3D or 2D fallback. CI perf smoke tests will assert these.
- Tech stack: Vanilla ES6, Custom WebGL (no three.js), AudioWorkletNode pipeline, in-worklet JS FFT (radix-2) with Hann/Hamming/Blackman and configurable overlap; zero external deps; no build system. Fallback: ScriptProcessorNode with reduced load.
- 3D approach: Static 256×256 mesh; spectrogram as a [freq×time] float texture updated per frame by single-row texSubImage2D with circular y-offset. Shaders use normalized UVs and the same log/dB mapping as 2D.
- Exports: WAV 32f default (16-bit optional), CSV matrix (rows=time, cols=freq bins) with header (sampleRate, fftSize, window, overlap, dB range), PNG with embedded metadata. Examples will be added to docs.
- API surface: Minimal, embeddable API with options, start/stop/setOptions/snapshot/export, and events (frame, error, perf, export). Stable names aligned with PRD §7.1.
- Accessibility: WCAG 2.1 AA target; keyboard navigation, ARIA labels, high-contrast/Colorblind palette (Cividis). Scale legends readable on HiDPI.
- Devices split: Optimize defaults for 70% desktop / 30% mobile. Mobile lowers FFT/history automatically; user can override.
- Cadence & resourcing: 1-week sprints, 1–2 FTE, this D0 sprint limited to 3 days to unblock Sprint 1.

---
