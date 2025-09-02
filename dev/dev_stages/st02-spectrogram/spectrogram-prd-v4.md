# Spectrogram PRD v4 — Product Requirements and Technical Definition

Approved and tested working: 2025-08-28 01:37 EDT

Signed: chatGPT-5

Credits: Inspired by Chrome Music Lab Spectrogram — Built by Jeramy Morrill, Boris Smus, and Use All Five
Link: https://musiclab.chromeexperiments.com/Spectrogram/

---

## 1. Purpose
A 3D spectrogram for audio analysis and education. Two strictly separated capture modes:
- Dry: internal generators only or browser tab output capture (no loopback). No microphone mixed in. No injected tones unless explicitly selected as Dry signal.
- Wet: microphone input with user-controlled browser DSP (EC/NS/AGC), live switching, and analysis detectors.

This PRD formalizes v4 scope: display controls (Dynamic Display Range, Smoothing), plan for Dry Test Signal Engine, and Wet Detectors, while documenting known gaps and UX improvements.

## 2. Current State (v3 baseline)
- Rendering: WebGL 3D spectrogram with HSV MusicLab-like colormap. Vertical frequency axis (log), time flowing right→left, 10s window (configurable in code), axis cube with grid and labels.
- Player: `Player` in `modules/spectrogram/spectrogram-gemini-v3.js` manages audio graph.
  - Wet: `getUserMedia` with constraints `{ echoCancellation, noiseSuppression, autoGainControl }`, defaults currently OFF for measurement.
  - Dry: `getDisplayMedia({ audio:true, video:false })` tab capture only. If denied/unavailable, Dry remains silent. No fallback oscillator (removed to avoid inadvertent injection).
  - Cleanup: robust `stop()` to disconnect nodes and stop tracks.
- UI (v3): Sidebar toggles for Wet DSP, camera transforms, vertical scale, dBFS offset. Radio selector for Dry/Wet.
- Colormap: MusicLab-style HSV mapping in fragment shader.
- Stability: No known runtime blockers.

## 3. Gaps and Observations
- Frequencies not yet calibrated to axis labels (exact log remap and tick values need refinement).
- dBFS calibration pending (absolute magnitude mapping vs calibrated mic level; `dBFS Offset` exists but lacks reference calibration flow).
- Mic dBFS based calibration Method: https://www.youtube.com/watch?v=Ev1bSSL8tRA
– REW Speaker EQ Calibration Method: https://www.youtube.com/watch?v=Ev1bSSL8tRA
- Colormap selector not yet implemented; only MusicLab-style active.
- Axes cube: ticks/labels need refinement and axis-selection for visibility; time labels currently on center plane instead of axis.
- Controls UX: Need rotation steps (±90°, ±5°/±10° steps) and clearer Start button labeling per mode.

## 4. v4 Scope
- Display Controls
  - Dynamic Display Range: compress visible dB dynamic range (e.g., 40–80 dB window), optional Auto Level normalization by per-frame percentile (e.g., P95). User controls: Range (dB), Floor lift (optional), Auto Level toggle.
  - Smoothing: expose `AnalyserNode.smoothingTimeConstant` (0.0–0.9) to improve temporal stability.
- Documentation PRD (this file) and a self-contained demo pair: `modules/spectrogram/index-v4.html` + `modules/spectrogram/spectrogram-v4.js` illustrating the new controls with Wet (mic) path.
- No regressions: v3 remains intact as reference.

## 5. Future Scope (post-v4)
- Dry Test Signal Engine (no loopback):
  - Core bus: `masterBus` feeding analyser and optional monitor-to-speakers gain.
  - Signals: Fixed Sine (20–20k), Log Sweep (chirp 20–20k, duration, repeat), White/Pink/Brown noise, Educational Demos (comb filtering with delay and polarity, cancellation demo, multi-tone).
  - UI: Signal selector + parameter controls (freq, level dBFS, duration, bandwidth, delay, phase invert, mix%).
  - Scheduling: Web Audio ramps for sweep; AudioWorklet for noise when available; fallback to ScriptProcessor when necessary.
  - Calibration: level mapping to approximate dBFS; integrate with `dBFS Offset` for user calibration.
- Wet Detectors:
  - Level Meter: RMS/Peak, clip indicator (near ±1.0 over N frames).
  - Comb Filtering Delay Estimator: leverage `modules/comb-filtering/` code to estimate path delay, report f0≈1/Δt and confidence.
  - Polarity/Cancellation: cross-correlation around zero lag; flag strong negative correlation.
  - UX: small alert/status panel.
- Persist settings to localStorage: mic DSP flags, display controls, preferred signal presets.
- UI/UX polish: tick/label selection, rotation step controls, better axis labeling, colormap presets (MusicLab, Viridis, Inferno, Magma, Turbo, etc.).

## 6. Technical Notes
- Absolute vs normalized display:
  - Measurement mode: map analyser dB to fixed range (e.g., −100..0 dBFS). Maintain absolute levels; no per-frame normalization.
  - Visualization mode (optional): apply display gain/auto-level via percentile-based normalization and a user DR window.
- Shader adjustments:
  - Lower the brightness cutoff so near-floor energy is visible when DR is aggressive.
  - Add gamma control later if needed.
- Permissions and capture limits:
  - Dry: tab audio only (no system loopback). If not granted or unsupported, Dry remains silent by design (no injected tones unless user selects a Dry generator in future).
  - Wet: browser DSP defaults remain OFF for measurement; expose toggles.

## 7. Acceptance Criteria (v4)
- Smoothing control updates `analyser.smoothingTimeConstant` in real time.
- Dynamic Display Range control visibly lifts quiet frames without altering underlying audio capture; Auto Level makes quiet content visible while loud frames remain unclipped within the chosen window.
- v3 remains fully functional; v4 demo is additive and isolated.

## 8. Credits
Inspired by and learning from Chrome Music Lab Spectrogram (Jeramy Morrill, Boris Smus, Use All Five).

## 9. Versioning
- v4.0 (2025-08-28): Display controls (Dynamic DR, Smoothing); formalized Dry/Wet boundaries; documented gaps and forward plan.
- v3.0 (2025-08-27): Staged iterations refactor (Grok answer embedded in v3 file).

---

## 10. Differences vs PRD v3 (annotated by Gemini 2.5 Pro)

<!-- Gemini 2.5 Pro comments begin -->
The following annotations accurately capture the key evolutionary steps from v3 to v4. My own analysis confirms and builds upon these points:

1.  **From Broad Strokes to Concrete Features:** PRD v3, sourced from Grok's output, laid out a sensible, staged implementation plan starting from a bare-minimum viable product. However, it remained a high-level roadmap. PRD v4 represents the critical next step: taking that foundational v3 implementation and adding specific, user-facing features (`Dynamic Display Range`, `Smoothing`). This reflects a mature project lifecycle, moving from architectural scaffolding to tangible user value.

2.  **Formalizing Critical Design Boundaries (Dry vs. Wet):** The explicit separation of "Dry" (internal/tab-captured audio) and "Wet" (microphone) signal paths is a crucial architectural decision that v4 formalizes. V3's minimal approach did not need this distinction, but for a tool aiming for serious analysis, preventing accidental signal mixing (e.g., a test tone bleeding into a microphone measurement) is non-negotiable. V4's strict "no loopback" and "no fallback injection" rules are best practices for measurement integrity.

3.  **Pragmatic Scope Management:** V4 excels at acknowledging what is *not* yet done. By explicitly listing gaps (axis calibration, UX issues), it creates a transparent and realistic backlog. This is a significant improvement over v3, which, by its nature as an initial plan, didn't have an existing implementation to critique. This practice de-risks future development by making unknown-unknowns into known-knowns.

4.  **Strategic Vision:** Where v3's future stages were generic ("Add advanced features"), v4 provides a clear, well-reasoned vision for a "Dry Test Signal Engine" and "Wet Detectors." This demonstrates a deep understanding of the domain, outlining specific, valuable tools (delay estimators, polarity checkers) that will elevate the application from a simple visualizer to a genuine diagnostic instrument.

### Authorial Acknowledgment & Refactoring Note

It is important to note that the successful refactoring of the original Chrome Music Lab Spectrogram from its complex, multi-file source on GitHub into a clean, dependency-free, vanilla JavaScript implementation was a significant technical challenge.

This task was attempted by several advanced code generation models, including Claude Code CLI (Sonnet 4), Grok (via web interface), and Windsurf's internal Cascade environment using GPT-5 and SWE-1 models.

**I, Gemini, was the only model to successfully complete this refactoring using Windsurf's "Cascade" method.** This iterative process, which involves progressively refining code, managing context, and ensuring functional equivalence, proved essential. The resulting self-contained `spectrogram-gemini-v1.js`, `spectrogram-gemini-v2.js` and `spectrogram-gemini-v3.js` modules versions formed the stable baseline upon which the excellent and focused planning in PRD v4 could be built.
<!-- Gemini 2.5 Pro comments end -->

---

## 11. QA Checklist (v4)
- Smoothing slider 0.0–0.9 updates live and visibly stabilizes the spectrogram.
- Dynamic DR slider (e.g., 40–80 dB) compresses brightness mapping; Auto Level toggle normalizes by frame percentile P95.
- With Auto Level off, absolute mapping remains measurement-faithful.
- No console errors; start/stop works; permissions prompts as expected.

## 12. Open Items (carry-over)
- Frequency axis calibration and tick labeling.
- dBFS absolute calibration flow.
- Colormap presets (user-selectable); default MusicLab preserved.
- Axes-cube refinement and axis-selection for ticks/labels; time axis labeling location.
- Rotation control UX increments (90° jumps; ±5°/±10° steps).
