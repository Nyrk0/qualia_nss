# Product Requirements Document: Spectrogram Visualizer
## Consolidated Single Source of Truth

## 1. Introduction & Objective

This document consolidates all requirements for the Qualia NSS Spectrogram Visualizer, a high-performance 3D terrain visualization tool for real-time audio analysis. This PRD serves as the single source of truth, incorporating insights from technical analysis, implementation planning, and architectural evaluation.

**Objective:** To create a professional-grade, real-time 3D spectrogram visualizer with perpendicular top-down terrain view, optimized for measurement accuracy and visual clarity.

**Original Implementation Reference:** [Chrome Music Lab Spectrogram](https://musiclab.chromeexperiments.com/Spectrogram/)

## Executive Summary

Based on comprehensive technical analysis of Google's Chrome Music Lab Spectrogram, this project implements a sophisticated 3D terrain visualization using WebGL with fixed perpendicular top-down camera view. The system leverages Web Audio API for real-time frequency analysis, custom FFT processing with configurable windowing functions, and GPU-accelerated rendering for optimal performance. Key innovations include scrolling texture-based height mapping, logarithmic frequency scaling (20Hz-20kHz), and MusicLab colormap for amplitude visualization.

## 2. Core Features

The refactored implementation must retain the core functionality 3D visualization from mic signal of the original experiment.

### 2.1. Audio Input Sources
The visualizer must support the following audio sources:
- **Microphone Input:** Real-time analysis of audio from the user's microphone.
- **Audio Constraints for Measurement:** Request mic with `echoCancellation=false`, `noiseSuppression=false`, `autoGainControl=false` for measurement integrity.
- **Sample Rate Awareness:** Dynamically detect and adapt to the actual sample rate of the audio source.

### 2.2. Visualization Modes & Canonical Rendering Model

To ensure a correct and consistent implementation, this project will adhere to the following canonical rendering model, which defines both the final on-screen visual layout and the underlying 3D data model.

#### **Part A: On-Screen Visual Layout (The User's View)**
This describes what the user sees on the 2D canvas for both modes.

- **Vertical Axis (Screen Y):** Represents **Frequency**. The scale is logarithmic, with a default range of 20Hz to 20kHz. The actual maximum frequency will be dynamically capped at the audio source's Nyquist frequency (`sampleRate / 2`) if it is lower than 20kHz, ensuring the visualization is always accurate. Top-of-canvas frequency is `min(20 kHz, Nyquist)`. If Nyquist < 20 kHz, labels and grid cap at Nyquist to avoid misleading empty bands. **3D terrain display places frequency on the vertical axis with 20Hz at bottom and 20kHz at top using logarithmic scaling.**
- **Horizontal Axis (Screen X):** Represents **Time**. The present moment (`t=0`) is always at the rightmost edge of the canvas. The visualization scrolls from right to left, with the past appearing to the left (e.g., -2s, -4s). **3D terrain display places time edge origin at right canvas (time=0), then slices scroll to the left canvas with a 10-second time window span.**
- **Amplitude Representation:** The default colormap for all modes is **MusicLab**, and the default dynamic range for normalization is **-100dB to -20dB**.
    - In **2D Mode**, amplitude is represented by **Color Intensity**.
    - In **3D Mode**, amplitude is represented by both the **Height** of the 3D terrain and by **Color Intensity**. **The 3D terrain is rendered from a perpendicular top-down centered view point.**
- **Frequency Grid Specification:** Render grid/labels at `[20, 50, 100, 200, 500, 1k, 2k, 5k, 10k, 20k]` Hz using the same log mapping as the shader; skip >Nyquist labels.

#### **Part B: Underlying 3D Data Model (The Technical Implementation)**
To produce the visual layout described above, the underlying 3D model and camera will be configured as follows, matching the original Google implementation:

- **Model Axes (Definitive):**
    - **Model X-axis → Frequency**
    - **Model Z-axis → Time**  
    - **Model Y-axis → Amplitude (Height)**
- **Modern WebGL 3D Parameters:**
    - **Geometry Size:** 9.5 units (`geometrySize = 9.5`) - preserves Google's scale
    - **Mesh Resolution:** 256×256 vertices (with adaptive fallbacks: 192×192, 128×128 for mobile)
    - **Camera Distance:** -9.0 units from origin - preserves Google's viewing distance
    - **Default Camera Rotations:** `x: -60°, y: -90°, z: 0°` - modern WebGL standard approach
    - **Mouse Sensitivity:** 3.0 scale factor for intuitive interaction
- **WebGL Implementation Requirements:**
    - **Vertex Texture Sampling:** Required capability (`MAX_VERTEX_TEXTURE_IMAGE_UNITS > 0`)
    - **Context Creation:** WebGL 1.0 with `'experimental-webgl'` fallback
    - **Texture Configuration:** `CLAMP_TO_EDGE`, `REPEAT`, `LINEAR` filtering

#### **Part C: Time Window & Velocity**
- **Default Time Window:** The spectrogram will display a **10-second** window of audio history by default. This is achieved with a fixed-resolution data texture, where the scroll speed is adjusted to fit the selected time window (5s, 10s, or 15s). This avoids performance issues from dynamically resizing GPU resources. Texture height (time rows) is fixed at 256. The scroll velocity (rows/sec) changes with 5/10/15s windows. 3D mesh remains 256×256; shaders sample texture via normalized UVs.
- **Velocity Control:** A clock icon in the UI will allow the user to toggle the time window between **5s** (fastest scroll), **10s** (default), and **15s** (slowest scroll).

### 2.3. User Interaction & Controls

#### **Primary UI Controls**
- **Mode Toggle:** Clean interface for switching between 2D and 3D visualization modes.
- **Audio Source Selection:** Device picker for microphone input with real-time device detection.

#### **Analysis Controls**
- **FFT Size Control:** Configurable FFT size with presets: 1024, 2048 (default), 4096, 8192. Higher values provide better frequency resolution at the cost of temporal resolution.
- **Windowing Function Control:** Dropdown to select FFT windowing function:
  - **Hann** (default) - Good balance of frequency resolution and leakage suppression
  - **Hamming** - Similar to Hann with slightly different characteristics  
  - **Rectangular** - No windowing (raw data) for maximum temporal resolution
  - **Blackman** - Better sidelobe suppression for pure tone analysis
- **Overlap Control:** Configurable overlap percentage (0%, 25%, 50%, 75%) for temporal smoothness vs. computational efficiency.

#### **Calibration & Measurement**
- **Input Gain / Calibration Offset:** Number input or slider to apply a dB offset to the microphone input signal. Implemented using a `GainNode` placed before the `AnalyserNode` in the audio graph: `gain = 10^(dB_offset/20)`. Allows calibration to match known reference levels (e.g., calibrated SPL meter).
- **Dynamic Range Control:** Adjustable min/max dB range for amplitude normalization (default: -100dB to -20dB).
- **Frequency Range Selector:** Option to focus on specific frequency ranges (e.g., voice: 80Hz-8kHz, music: 20Hz-20kHz, ultrasonic: up to Nyquist).

#### **Interactive Tone Generation**
- **Piano Keyboard (MVP Implementation):**
  - 2-octave piano-style keyboard displayed vertically on the right edge of canvas
  - Pure **sine wave** tone generation at corresponding musical pitches
  - **Closed-Loop Audio Routing:** Generated tones route *only* to main audio output (speakers). Microphone remains active to capture resulting sound after passing through speakers and room environment.
  - Real-time visualization of captured sound on spectrogram
  - Configuration dropdowns: Root Note, Scale (Major/Minor), Reference Pitch (A4=440Hz)
  - **Polyphonic Support:** Multiple simultaneous tones for chord analysis

#### **Reference Signal Generation**
- **Test Signal Generator:**
  - **White Noise:** Flat frequency response reference
  - **Pink Noise:** 1/f frequency response reference  
  - **Brown Noise:** 1/f² frequency response reference
  - **Sine Sweep:** Logarithmic frequency sweep for system response analysis
  - **Audio Routing:** Like piano, signals route only to main output for closed-loop analysis

#### **Advanced Analysis Features**
- **Peak Detection:** Automatic identification and labeling of spectral peaks
- **Harmonics Analysis:** Detect and highlight harmonic relationships
- **Real-time Statistics:** Display current peak frequency, RMS level, spectral centroid
- **Measurement Markers:** Click-to-place frequency and amplitude measurement cursors

## 3. Technical Requirements & Architecture

### 3.1. Core Architectural Principle: Data Model Consistency

To ensure maximum coherence and maintainability, all parts of the implementation must adhere to the canonical Google data model.

- **Data Model:** The internal representation of the spectrogram data will always use the `X=Frequency`, `Z=Time`, `Y=Amplitude` convention.
- **2D & 3D Renderers:** Both the 2D and 3D rendering functions must be implemented to consume this data model. The 2D renderer will achieve the correct on-screen layout by mapping the model's X (Frequency) to the canvas's Y-axis and the model's Z (Time) to the canvas's X-axis.

This principle ensures that the 2D view is a direct orthographic projection of the 3D model's floor, creating a seamless user experience when toggling between modes.

### 3.2. Technology Stack & Dependencies

The refactored application should be built with modern web standards, ensuring performance and maintainability.

- **Language:** JavaScript (ES6+) with optional TypeScript definitions for better developer experience.
- **Rendering:** WebGL 2.0 preferred (with WebGL 1.0 fallback) for 3D visualization, HTML5 Canvas for 2D fallback.
- **Audio Processing:** Web Audio API is mandatory.
- **Matrix Mathematics:** Self-contained 4x4 matrix operations (no external math libraries).
- **Dependencies:** The final script should be self-contained with zero external dependencies.
- **Build Process:** No build system required - simple `index.html` including `script.js` should be sufficient.
- **Module System:** ES6 modules for code organization, but bundled into single file for distribution.

### 3.3. Performance & Compatibility Requirements

- **Performance Targets:** 
  - Desktop: Maintain 60 FPS consistently
  - Mobile: ≥30 FPS on mid-tier devices (iPhone 8, Android equivalent)
  - Memory: <100MB total memory usage
  - CPU: <25% single-core utilization on modern hardware
- **Browser Support:**
  - Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
  - WebGL support with vertex texture sampling capability
  - Web Audio API with AnalyserNode support
- **Adaptive Performance Features:**
  - **Mesh Resolution Scaling:** Automatically reduce from 256×256 to 192×192 or 128×128 based on canvas size
  - **Frame Rate Monitoring:** Detect performance drops and adapt quality accordingly
  - **Memory Management:** Explicit WebGL resource cleanup to prevent memory leaks
- **Graceful Degradation:**
  - Automatic fallback from 3D WebGL to 2D Canvas if WebGL unavailable
  - Handle WebGL context loss with automatic recovery
  - Manage microphone permission errors with clear user messaging
  - Support device hot-swapping (mic connect/disconnect events)

## 4. Key Implementation Details

### 4.1. Advanced Audio Processing Pipeline

#### **Custom FFT Implementation**
- **Critical Requirement:** Since the native `AnalyserNode` does not allow selectable windowing functions, a **custom FFT processing path** must be implemented using `ScriptProcessorNode` or `AudioWorkletNode`.
- **Windowing Pipeline:** Apply selected windowing function to time-domain samples before FFT.
- **Overlap-Add Processing:** Implement configurable overlap (50% recommended) using Hann windowing for temporal continuity matching Chrome Music Lab smoothness.
- **Zero-Padding:** Support zero-padding for frequency interpolation when needed.

#### **Audio Graph Architecture**
```
Input → GainNode (calibration) → ScriptProcessor/AudioWorklet (custom FFT) → AnalyserNode (backup) → AudioContext.destination
                                                ↓
                                           FFT Data → Texture Update
```

#### **Real-time Processing Optimizations**
- **Double Buffering:** Ping-pong between two texture buffers for smooth updates
- **Worker Thread:** Off-main-thread FFT processing using AudioWorkletNode
- **Batch Updates:** Group multiple spectrum updates per frame to reduce GPU state changes
- **Adaptive Quality:** Reduce FFT size under heavy CPU load

### 4.2. Enhanced 3D Rendering Pipeline

#### **Geometry & Mesh Management**
- **Static Mesh:** Single 256×256 grid mesh generated once, stored in GPU buffer (VBO)
- **Vertex Attributes:** Position, texture coordinates (UV), with instanced rendering for efficiency
- **Level-of-Detail:** Optional mesh decimation for mobile devices (128×128 fallback)
- **Frustum Culling:** Skip rendering vertices outside camera view

#### **Texture Management & Data Layout**
- **Data Texture:** 2D texture serving as circular buffer: `[width, height] = [frequency, time]`
- **Texture Format:** `R32F` for single-channel float data, or `RGBA8` for packed data
- **Circular Buffer:** Efficient row-wise updates using `gl.texSubImage2D` for single-row writes
- **Texture Filtering:** Linear interpolation for smooth 3D surface rendering

#### **Shader Implementation (Google's Exact Approach)**
- **Vertex Shader Implementation:**
  - **Logarithmic Frequency Mapping:** `pow(256.0, texCoord.x - 1.0)` (Google's exact formula)
  - **Height Mapping:** `position.y + heightScale * audioSample.a`
  - **HSV Color System:** `hue = 360.0 - ((worldPosition.y / heightScale) * 360.0)`
  - **Time Offset Management:** `texture2D(audioTexture, vec2(x, texCoord.y + timeOffset))`
  
- **Fragment Shader Implementation:**
  - **Edge Fade Effect:** `pow(cos((1.0 - gl_FragCoord.y / 512.0) * 0.5 * π), 0.5)`
  - **Color Blending:** `mix(backgroundColor.rgb, vertexColor * fade, fade)`
  - **HSV-to-RGB Conversion:** Complete Google implementation with chroma calculation
  
- **Complete HSV-to-RGB Conversion Function:**
```glsl
vec3 convertHSVToRGB(float hue, float saturation, float lightness) {
    float chroma = lightness * saturation;
    float hueDash = hue / 60.0;
    float x = chroma * (1.0 - abs(mod(hueDash, 2.0) - 1.0));
    vec3 hsv = vec3(0.0);
    if(hueDash < 1.0) { hsv.r = chroma; hsv.g = x; }
    else if (hueDash < 2.0) { hsv.r = x; hsv.g = chroma; }
    else if (hueDash < 3.0) { hsv.g = chroma; hsv.b = x; }
    else if (hueDash < 4.0) { hsv.g = x; hsv.b = chroma; }
    else if (hueDash < 5.0) { hsv.r = x; hsv.b = chroma; }
    else if (hueDash < 6.0) { hsv.r = chroma; hsv.b = x; }
    return hsv;
}
```

#### **Camera & View System (Fixed Perpendicular View)**
- **Fixed Camera Position:** Perpendicular top-down centered view of the 3D terrain (eagle view)
- **No User Controls:** Camera position and orientation are fixed (no mouse/touch interaction)
- **Projection Matrix:** 55° FOV (preserves Google's viewing angle), aspect ratio adaptive, near=1, far=100
- **View Matrix:** Camera positioned at -9.0 units for optimal viewing distance
- **Coordinate Handling:** Standard WebGL coordinate system without legacy library dependencies

### 4.3. Advanced 2D Rendering Features

#### **High-DPI Support**
- **Canvas Scaling:** Automatic detection and handling of device pixel ratio
- **Crisp Rendering:** Proper canvas size vs. CSS size management
- **Text Rendering:** High-resolution frequency labels and grid lines

#### **Interactive Features**
- **Zoom & Pan:** Mouse wheel zoom with smooth interpolation
- **Selection Tools:** Frequency range selection with visual feedback
- **Crosshairs:** Real-time frequency/amplitude readout at mouse position
- **Spectral Analysis:** Click-and-drag to analyze specific time/frequency regions

## 5. Advanced User Experience Features

### 5.1. Professional Analysis Tools

#### **Measurement Capabilities**
- **Cursor Measurements:** Dual cursors for delta frequency/amplitude measurements  
- **Peak Detection:** Automatic spectral peak finding with threshold controls
- **THD Analysis:** Total Harmonic Distortion calculation and visualization
- **Spectral Tilt:** Automatic measurement of overall frequency response slope

#### **Export & Save Functions**
- **Screenshot Export:** High-resolution PNG export of current view
- **Data Export:** CSV export of spectral data for external analysis
- **Session Save:** Browser localStorage for UI settings persistence
- **Preset Management:** Save/load custom analysis configurations

### 5.2. Accessibility & Usability

#### **Accessibility Features**
- **Keyboard Navigation:** Full keyboard control for all interactive elements
- **Screen Reader Support:** ARIA labels and descriptions
- **High Contrast Mode:** Alternative color schemes for visibility impairments
- **Color Blind Support:** Cividis colormap option for color vision deficiencies

#### **User Interface Enhancements**
- **Responsive Design:** Adaptive layout for different screen sizes
- **Touch Support:** Mobile-friendly touch controls for pan/zoom/rotate
- **Contextual Help:** Inline tooltips and help system
- **Performance Monitor:** Optional FPS and resource usage display

## 6. Colormap Definitions (Source of Truth)

This section serves as the definitive reference for the color palettes used to visualize amplitude.

### Overview
The colormaps are primarily sequential and designed to be perceptually uniform—so perceived color differences track data differences—important for accurate audio intensity representation. Each colormap is defined by anchor points (position 0–1, RGB 0–255). A `buildLUT()` function interpolates these into a 256-entry lookup table (LUT).

- **Default Colormap:** **MusicLab**
- **Perceptually Uniform Options:** Inferno, Viridis, Magma, Plasma, Cividis
- **Specialized Options:** Grayscale, Hot, Cool, Jet (for compatibility)

### Anchor Definitions

#### MusicLab (Default)
```js
[0.0, [10, 0, 20]],
[0.1, [128, 0, 128]], 
[0.2, [0, 0, 255]],
[0.35, [0, 128, 255]],
[0.5, [0, 255, 255]],
[0.65, [0, 255, 128]],
[0.8, [0, 255, 0]],
[0.9, [128, 255, 0]],
[0.95, [255, 255, 0]],
[1.0, [255, 128, 0]]
```

#### Inferno (Perceptually Uniform)
```js
[0.0, [0, 0, 4]],
[0.1, [22, 11, 57]],
[0.2, [66, 10, 104]],
[0.3, [106, 23, 110]],
[0.4, [147, 38, 103]],
[0.5, [188, 55, 84]],
[0.6, [221, 81, 58]],
[0.7, [243, 120, 25]],
[0.8, [252, 165, 10]],
[0.9, [246, 215, 70]],
[1.0, [252, 255, 164]]
```

#### Cividis (Colorblind-Optimized)
```js
[0.0, [0, 34, 78]],
[0.1, [8, 51, 112]],
[0.2, [53, 69, 108]],
[0.3, [79, 87, 108]],
[0.4, [102, 105, 112]],
[0.5, [125, 124, 120]],
[0.6, [148, 142, 119]],
[0.7, [174, 163, 113]],
[0.8, [200, 184, 102]],
[0.9, [229, 207, 82]],
[1.0, [254, 232, 56]]
```

## 7. Implementation Consistency Framework

### 7.1. Shared System Components

#### **Unified Frequency Mapping**
- **Single Logarithmic Function:** One `freqToPosition()` function drives:
  - 2D canvas row mapping
  - 3D shader texture coordinate remapping  
  - Frequency grid line placement
  - Piano keyboard note positioning

#### **Unified Amplitude Normalization**  
- **Single dB Conversion:** One `amplitudeToNormalized()` function for:
  - 2D colormap lookup
  - 3D height scaling
  - UI amplitude displays

#### **Unified Time Management**
- **Single Circular Buffer:** One time index system drives:
  - 2D rightmost-edge-is-now rendering
  - 3D leading-edge texture updates
  - Time axis labels and grid

### 7.2. Development & Testing Guidelines

#### **Code Quality Standards**
- **ES6+ Modern JavaScript:** Use async/await, destructuring, arrow functions
- **Modular Architecture:** Separate classes for rendering, audio, UI, math utilities
- **Error Handling:** Comprehensive try/catch with user-friendly error messages
- **Performance Monitoring:** Built-in performance profiling hooks

#### **Testing Strategy**
- **Cross-Browser Testing:** Automated testing on all supported browsers
- **Performance Benchmarking:** Automated FPS and memory usage tests
- **Audio Accuracy Testing:** Verify against known test signals
- **Mobile Device Testing:** Real device testing on representative hardware

#### **Documentation Requirements**
- **API Documentation:** JSDoc comments for all public methods
- **Implementation Guide:** Step-by-step developer setup instructions
- **User Manual:** Complete feature documentation with screenshots
- **Performance Guide:** Optimization tips and troubleshooting

## 8. Implementation Roadmap

### Phase 1: Critical Fixes (Week 1)
- Fix DOM element access errors and HTML-JavaScript mismatches
- Implement comprehensive error handling framework
- Add missing UI elements and restore basic functionality
- Establish proper WebGL context loss recovery

### Phase 2: Architecture & Performance (Week 2-3)
- Modular refactoring (AudioProcessor, Renderer3D, UIController)
- Custom FFT implementation with windowing functions
- MusicLab colormap implementation
- Adaptive mesh resolution for mobile devices
- Performance optimization and memory management

### Phase 3: PRD Feature Completion (Week 4-5)
- Logarithmic frequency scaling (20Hz-20kHz)
- Fixed perpendicular top-down camera view
- Measurement-mode audio constraints
- Export capabilities (PNG, CSV, WAV)
- Professional analysis tools integration
- Comprehensive testing and documentation

### Success Metrics
- <60ms mic-to-visual latency (desktop)
- 60 FPS consistent performance
- ≥30 FPS 3D rendering
- <100MB memory usage
- <25% single-core CPU utilization
- Zero critical bugs and DOM access errors

## 9. Technical Architecture Summary

### Core Components
1. **AudioProcessor**: Web Audio API integration, custom FFT with windowing
2. **Renderer3D**: WebGL terrain rendering with fixed perpendicular view
3. **UIController**: Interface management without camera controls
4. **DataPipeline**: Real-time frequency data processing and texture updates

### Key Technical Innovations
- Scrolling 2D texture as dynamic height map (GPU-optimized)
- Single 256×256 mesh with efficient single-draw-call rendering
- Logarithmic frequency mapping with Google's exact formula
- MusicLab colormap with HSV-to-RGB conversion
- Adaptive quality controls for mobile devices

## References & Documentation

### Technical References
* Original Chrome Music Lab Spectrogram: https://github.com/googlecreativelab/chrome-music-lab/tree/master/spectrogram
* Web Audio API Specification: https://www.w3.org/TR/webaudio/
* WebGL 2.0 Specification: https://www.khronos.org/webgl/
* Audio DSP Theory: "Understanding Digital Signal Processing" by Richard Lyons

### Project Documentation
* AUDIT_REPORT.md - Technical analysis and critical issues
* IMPLEMENTATION_PLAN.md - Detailed development roadmap
* spectrogram_visualization_executive_report.md - Executive technical evaluation

### Consolidated Requirements Status
This PRD consolidates and supersedes all previous specification documents, serving as the single source of truth for the Qualia NSS Spectrogram Visualizer project. All implementation decisions should reference this document as the authoritative specification.