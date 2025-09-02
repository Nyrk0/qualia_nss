# Product Requirements Document: Spectrogram Visualizer

**Version:** 5.0 (Reverse-Engineered from Source)
**Date:** 2025-08-30

## 1. Introduction & Objective

This document provides a definitive specification of the Spectrogram Visualizer module as it is currently implemented in the Qualia-NSS codebase. It is the result of a reverse-engineering process, intended to serve as the single source of truth, superseding all previous versions (v1-v4).

- **Objective:** To document the existing features, architecture, and behavior of the real-time 3D spectrogram for analysis, maintenance, and future development.
- **Code Source:** `src/spectrogram/spectrogram.js`

---

## 2. Credits & Influences

### 2.1. Core Implementation

The core 3D spectrogram rendering logic is heavily inspired by the **Chrome Music Lab Spectrogram**.

-   **Original Authors:** Jeramy Morrill, Boris Smus, and Use All Five.
-   **Source:** [github.com/googlecreativelab/chrome-music-lab/tree/master/spectrogram](https://github.com/googlecreativelab/chrome-music-lab/tree/master/spectrogram)

### 2.2. Psychoacoustic Visualization

The 7-band frequency axis model and the associated `tone-control` web component's colormap were developed by **QUALIA-NSS**. This model provides users with an intuitive analogy, linking color and frequency to the simplified bands of human hearing perception.

---

## 3. Core Features (As Implemented)

### 3.1. Audio Processing & Input

The `Player` class manages all audio operations using the Web Audio API.

-   **Audio Graph:** A source node is connected to a single `GainNode` (mix), which feeds a single `AnalyserNode`. The output is not routed to the context destination, preventing audio loopback.
-   **Wet Mode (Microphone):**
    -   Captures audio via `navigator.mediaDevices.getUserMedia`.
    -   Provides user-configurable DSP options, which are **disabled by default** for measurement accuracy:
        -   `echoCancellation: false`
        -   `noiseSuppression: false`
        -   `autoGainControl: false`
-   **Dry Mode (Tab/System Audio):**
    -   Captures audio via `navigator.mediaDevices.getDisplayMedia({ audio: true })`.
    -   If the user denies permission or the feature is unavailable, the source remains silent, and the spectrogram displays the noise floor.
-   **Analyser Configuration:**
    -   `fftSize`: 2048 (fixed)
    -   `smoothingTimeConstant`: 0 (disabled, for raw frame data)
    -   `minDecibels`: -100
    -   `maxDecibels`: 0

### 3.2. 3D Spectrogram Visualization

The `AnalyserView` class handles all WebGL rendering.

-   **Rendering Context:** WebGL 1.0 with a fallback to `experimental-webgl`.
-   **3D Model & Axes:**
    -   **Frequency (X-axis):** Represents frequency, logarithmically scaled.
    -   **Amplitude (Y-axis):** Represents magnitude in dBFS.
    -   **Time (Z-axis):** Represents time, with the newest data at the back, scrolling forward.
-   **Geometry:**
    -   A 256x256 grid mesh (`sonogram3DWidth` x `sonogram3DHeight`).
    -   The geometric size of the plane is 9.5 units.
-   **Camera:**
    -   The default camera orientation is set to a perspective view (`xRot: -90`, `zRot: 270`).
    -   The default position is `yT: -3.5`, `zT: -7.5` (zoom).
-   **Data Mapping:**
    -   **Frequency Mapping:** Uses the canonical Chrome Music Lab formula `pow(256.0, u - 1.0)` for logarithmic scaling, where `u` is the normalized frequency.
    -   **Amplitude Mapping:** The 8-bit value from the analyser (`0-255`) is mapped linearly to the `-100` to `0` dBFS range. This dB value, adjusted by the user-configurable `dbfsOffset`, determines the vertex height on the Y-axis.
    -   **Time Mapping:** Time is represented by continuously updating a circular 2D texture buffer (`TEXTURE_HEIGHT: 256` rows), which gives the scrolling effect.

### 3.3. Colormaps & Visuals

-   **Terrain Colormap (MusicLab Style):** The color of the 3D terrain is determined in the fragment shader using an HSV-to-RGB conversion that mimics the Chrome Music Lab visual style. The hue is calculated as `h = (1.0 - value) * 0.7`, where `value` is the normalized amplitude.
-   **QUALIA 7-Band Psychoacoustic Model:**
    -   This model is **not used for coloring the spectrogram terrain**.
    -   It is used exclusively to generate the **ticks and labels for the Frequency (X) axis**. This provides a perceptually relevant visual guide based on the following bands: Sub-bass, Bass, Low Mid, Midrange, Upper Mid, Presence, and Brilliance.
-   **Axis & Grid:** A 3D bounding box with axis lines (X=Red, Y=Green, Z=Blue), grid ticks, and dynamic text labels are rendered to provide spatial context.

### 3.4. User Interface & Controls

The UI is composed of the main canvas and sidebar controls.

-   **Main View:**
    -   `spectrogram` canvas for WebGL rendering.
    -   `start-button` to initialize audio capture.
    -   `tone-control` web component to generate a separate, audible sine wave for testing.
    -   A static legend for the MusicLab colormap.
-   **Sidebar Controls:**
    -   **Camera:** Sliders for X/Y/Z rotation and Y/Z position (zoom).
    -   **Display:** Slider for `verticalScale` (amplitude exaggeration) and `dbfsOffset` (calibration).
    -   **Audio Source:** Radio buttons to switch between `Wet` and `Dry` modes.
    -   **Microphone DSP:** Checkboxes to toggle `echoCancellation`, `noiseSuppression`, and `autoGainControl` for the Wet source.

---

## 4. Technical Specification

-   **Language:** Vanilla JavaScript (ES6+).
-   **Dependencies:** The module is self-contained with no external runtime libraries.
-   **Architecture:** The logic is encapsulated in `Player` (audio) and `AnalyserView` (rendering) classes, initialized and wired to the UI in the `initializeSpectrogram` function. All matrix math is handled by a self-contained `Matrix4x4` class.
-   **Shaders:** GLSL shaders are inlined as strings within `spectrogram.js`.

---

## 5. Scientific References & Future Work

### 5.1. 7-Band Model Validation

The psychoacoustic 7-band model used for the frequency axis annotation is based on common audio engineering principles. However, a list of formal scientific studies to validate this specific simplification of human hearing perception is a pending task.

### 5.2. Future Scope

Based on previous planning documents (`comb-filtering-detection.md`, `spectrogram-prd-v4.md`), potential future enhancements include:
-   **Wet Detectors:** Real-time analysis for phenomena like comb-filtering.
-   **Dry Test Signal Engine:** A built-in generator for signals like noise and sweeps, routed internally.
-   **UI/UX Polish:** User-selectable colormaps, improved camera controls, and data export capabilities.
