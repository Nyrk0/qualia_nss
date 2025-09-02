https://musiclab.chromeexperiments.com/Spectrogram/ 
https://github.com/googlecreativelab/chrome-music-lab/tree/master/spectrogram
[PRD v2](spectrogram-prd-v2.md)

PROMPT: (to Grok)
Hi.
This is an 3D spectrogram project PRD.
please:
1. check PRD consistency.
2. refactor PRD with staged iterations approach: a) simplest minimal .js implementation using mic, file:// (local .html browser file load) and 3D WebGL, use canvas vertical axis for hz top-bottom = 20KHz-20Hz and horizontal axis for time, right edge = time 0 (3D terrain slices comes from this side) flowing to left = time negative, window span = 10 seconds, use all browser window as canvas available for display terrain, use musiclab's colormap, b) leave all the rest to next improvement stages.
3. propose index-min.html along spectrogram-min.js for stage minimal implementation.
4. provide spectrogram-prd-v3.md as a downloadable markdown file, with your signature and https://grok.com/chat/fa315979-96d1-472a-9e7b-7c5d1103737c as source reference.
5. provide both .html and .js files as requestes, downloadable ones.
thanks! and good luck.

GROK's answer:

PRD Consistency Check
The provided spectrogram-prd-v2.md is internally consistent overall. It describes a coherent WebGL-based 3D spectrogram system with proper audio integration, shader logic, texture management, and error handling. Key components like the audio graph, FFT configuration, and rendering pipeline align well with Web Audio and WebGL specifications. However, there are minor issues:

Shader typo: In the vertex shader, texture2D(audioTexture, vec2(texCoord.x, texCoord.y + timeOffset)) should likely be vec2(texCoord.x + timeOffset, texCoord.y) to shift along the time axis (x) instead of frequency (y), enabling correct scrolling.
Texture extensions: OES_texture_float is listed but not strictly used (byte textures are employed), so it's optional. Validation code is solid but could note fallback.
Log mapping: The log2(i+1) in texture update is an approximation; a true exponential mapping (as refined in v3) would better match perceptual frequency scaling.
Performance: Adaptive quality is mentioned but not detailed for edge cases like low FPS.
Browser compat: Feature detection is good, but no fallback to 2D Canvas if WebGL fails.
No major contradictions; the document is ready for refactoring with stages.

2. Refactored PRD
The refactored PRD (v3) incorporates a staged iterations approach. Stage 1 focuses on the simplest minimal implementation as specified: mic input only, local file load compatibility, 3D WebGL terrain, full-window canvas, vertical freq axis (top 20kHz to bottom 20Hz, log-scaled), horizontal time axis (right = t=0, flowing left, 10s span), and MusicLab-style colormap. All other features (e.g., file input, controls, windowing, API) are deferred to later stages.
3. Proposed Minimal Implementation Files
Below are the proposed index-min.html and spectrogram-min.js for Stage 1. These can be saved locally and opened in a browser (file://) for testing. The JS implements the minimal requirements using Web Audio for mic input and pure WebGL for 3D rendering. It includes basic matrix functions for camera/projection (no external libs). Direction: New data enters from the right and flows left. Time span: ~10s, time-based updates. Colormap: As per MusicLab style in the fragment shader.
4. spectrogram-prd-v3.md
markdown# Spectrogram Visualizer - Technical Specification v3

## 1. Introduction
This specification refactors v2 to adopt a staged iterations approach for development, starting with a minimal viable implementation and building incrementally. The goal is a 3D spectrogram visualizer inspired by Chrome Music Lab, using Web Audio for input and WebGL for rendering.

## 2. Staged Iterations

### 2.1 Stage 1: Minimal Implementation
Focus on core functionality with hard-coded parameters for simplicity.
- **Audio Source**: Microphone only (via Web Audio API).
- **Deployment**: Local .html file load in browser (file:// protocol compatible, no server required).
- **Visualization**: 3D WebGL terrain on a full-window canvas.
  - Vertical axis: Frequency (log-scaled), top = 20kHz, bottom = 20Hz.
  - Horizontal axis: Time, right edge = time 0 (new data enters from right), flowing left to negative time.
  - Time window span: 10 seconds total.
- **Colormap**: MusicLab style (HSV-based in fragment shader).
- **FFT Configuration**: Fixed at 2048 size, 0.8 smoothing, -100 to -20 dB range.
- **Texture**: 256 (width, time) x 128 (height, freq) pixels, RGBA UNSIGNED_BYTE, LINEAR filtering, REPEAT_S / CLAMP_T wrap.
- **Update Logic**: Time-based column updates to achieve ~10s span; exponential log frequency mapping for resampling.
- **No Features**: No file input, no UI controls, no gain/mute, no error UI, no adaptive quality, hard-coded camera/view.
- **Browser Compat**: Assumes WebGL 1.0 support; no checks or fallbacks.

### 2.2 Stage 2: Basic Enhancements
- Add file input for audio files.
- Add basic UI controls (e.g., start/stop, FFT size dropdown).
- Implement gain node and mute.
- Add windowing functions (Hann default).
- Add simple error handling (console logs).

### 2.3 Stage 3: Advanced Features
- Add configurable parameters (smoothing, dB range, height scale).
- Implement adaptive quality (reduce resolution on mobile/low FPS).
- Add browser compatibility checks and fallbacks.
- Implement full error handling and validation.
- Add public API methods (start, stop, setFFTSize, etc.).

### 2.4 Stage 4: Optimization and Polish
- Implement double buffering for textures.
- Add frame skipping for performance.
- Integrate troubleshooting guides.
- Finalize integration guide.

## 3. Core Architecture (Stage 1)
- **WebGL Version**: 1.0 (no experimental fallback needed).
- **Context Creation**:
  ```javascript
  const gl = canvas.getContext('webgl');

No Extensions: Use byte textures only.
Texture Configuration:

Format: RGBA UNSIGNED_BYTE.
Dimensions: 256 (time) x 128 (freq).
Parameters: LINEAR min/mag, REPEAT_S (for circular scrolling), CLAMP_TO_EDGE_T.



4. Audio Processing (Stage 1)

Audio Graph: Microphone → AnalyserNode (no destination connect, silent).
FFT Configuration: Size 2048, smoothing 0.8.
dB Range: minDecibels -100, maxDecibels -20.
Data Retrieval: getByteFrequencyData for 0-255 scaled values.

5. Shader Programs (Stage 1)
5.1 Vertex Shader
glslattribute vec2 position;
attribute vec2 texCoord;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform sampler2D audioTexture;
uniform float timeOffset;
uniform float heightScale;

varying vec4 vColor;

void main() {
    // Sample audio data (fixed: shift x for time)
    vec4 audioSample = texture2D(audioTexture, vec2(fract(texCoord.x + timeOffset), texCoord.y));
    
    // Calculate position with height mapping (y inverted for bottom low freq)
    vec4 pos = vec4(position.x, audioSample.r * heightScale, position.y, 1.0);
    
    // Transform to clip space
    gl_Position = projectionMatrix * modelViewMatrix * pos;
    
    // Pass color to fragment shader
    vColor = vec4(audioSample.rrr, 1.0);
}
5.2 Fragment Shader
glslprecision mediump float;

varying vec4 vColor;

void main() {
    // Apply colormap (MusicLab style)
    vec3 color = vec3(0.0);
    float value = vColor.r;
    
    // HSV to RGB conversion with MusicLab colormap
    float h = (1.0 - value) * 0.7; // Hue (0.0 to 0.7)
    float s = 0.8;                 // Saturation
    float v = value > 0.1 ? 1.0 : 0.0; // Value with threshold
    
    vec3 hsv = vec3(h, s, v);
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(hsv.xxx + K.xyz) * 6.0 - K.www);
    vec3 rgb = hsv.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), hsv.y);
    
    gl_FragColor = vec4(rgb, 1.0);
}
6. Texture Update Logic (Stage 1)

Get frequency data.
Resample to 128 height with exponential log mapping (20Hz bottom to 20kHz top).
Update one column in texture (circular).
Time-based: Update only when delta time exceeds interval (10s / 256 columns).
Direction: Adjust timeOffset negative to flow left with latest at right.
Implementation snippet:
javascript// In updateTexture
for (let i = 0; i < this.meshHeight; i++) {
    const frac = i / (this.meshHeight - 1); // 0 bottom (20Hz), 1 top (20kHz)
    const f = 20 * Math.pow((this.nyquist / 20), frac);
    const linearPos = Math.floor(f * (this.frequencyData.length - 1) / this.nyquist);
    const value = this.frequencyData[linearPos] || 0;
    const idx = i * 4;
    columnData[idx] = value; columnData[idx+1] = value; columnData[idx+2] = value; columnData[idx+3] = 255;
}
// texSubImage2D to currentColumn
this.currentColumn = (this.currentColumn + 1) % this.meshWidth;
this.timeOffset = -this.currentColumn / this.meshWidth; // Negative for left flow


7. Rendering (Stage 1)

Fixed camera: Perspective FOV 45°, lookAt from [0,1,2] to [0,0,0], up [0,1,0].
Use minimal mat4 functions for matrices.
Draw triangles via element array.

8. Integration Guide (Stage 1)

Save index-min.html and spectrogram-min.js locally.
Open html in browser; grant mic permission.
Canvas auto-resizes to window.

9. Troubleshooting (Deferred to Later Stages)
Basic console logs only in Stage 1.
10. References

WebGL 1.0 Specification
Web Audio API Specification
Chrome Music Lab Spectrogram Implementation
WebGL Best Practices

11. Version History

v3.0 (2025-08-27): Refactored with staged iterations; defined minimal Stage 1.
v2.0 (2025-08-27): Complete rewrite with WebGL 1.0 compatibility
v1.0: Initial implementation

12. License
MIT License - See LICENSE file for details
Signed: Grok 4, built by xAI
Source: https://grok.com/chat/fa315979-96d1-472a-9e7b-7c5d1103737c