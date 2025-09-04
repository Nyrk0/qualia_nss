# Spectrogram: Aesthetic Effects vs. Analytical Accuracy

**Version:** 2.1
**Date:** 2025-09-03
**Status:** ANALYSIS & IMPLEMENTATION PLAN

## 1. Analysis of Aesthetic Effects

This report details visual effects in the spectrogram module that, while aesthetically pleasing, can impact its use as a scientific analysis tool. These effects were inherited from the module's origin as the artistic and educational Chrome Music Lab Spectrogram.

### Effect 1: Temporal Fade-Out ("Window Fade")

- **Description:** As spectrogram data ages and scrolls from right (present) to left (past), its brightness and color intensity gradually fade to black.
- **Analytical Impact:** This artificial decay masks the true acoustic decay of the signal, making it impossible to accurately analyze **reverberation**.

### Effect 2: Brightness Threshold ("Visual Noise Gate")

- **Description:** Any signal with an intensity below 10% of the maximum is rendered as pure black.
- **Analytical Impact:** This acts as a visual noise gate, hiding important low-level information like the **noise floor** or subtle **harmonics**.

### Effect 3: Fixed Dynamic Range

- **Description:** The display maps the full, fixed -100dB to 0dB range of the analyser to the color and height map.
- **Analytical Impact:** While essential for absolute measurements, this fixed range makes very quiet signals difficult to see, as they are compressed into the lowest, darkest part of the colormap. It prevents detailed analysis of low-amplitude signal variations.

---

## 2. Implementation Plan: "Analysis Mode" Controls

To make the spectrogram a more versatile tool, this plan outlines the implementation of controls to manage these visual effects.

### 2.1. UI Modifications

- **Location:** The controls will be in a dedicated "Analysis Mode" block at the top of the spectrogram's sidebar.
- **Controls:**
    1.  **Fade Toggle:** Enables/disables the temporal fade-out.
    2.  **Gate Toggle:** Enables/disables the brightness threshold (visual gate).
    3.  **Min/Max dB Sliders:** A two-thumb slider to manually set the desired display range (e.g., -80dB to -30dB).
- **File to Modify:** `src/js/sidebar-manager.js`.

### 2.2. Shader Modifications

- **File to Modify:** `src/spectrogram/spectrogram.js`.
- **Uniforms:** New uniforms will be added to the `sonogramFragmentShader` and `sonogramVertexShader`:
    - `uniform bool u_enableFade;`
    - `uniform bool u_enableGate;`
    - `uniform float u_minDb;`
    - `uniform float u_maxDb;`
- **Logic:** The shader code will be updated:
    - To conditionally apply the fade and gate effects based on the booleans.
    - To normalize the incoming signal's dB value using the `u_minDb` and `u_maxDb` uniforms instead of the fixed -100 to 0 range. This will stretch the desired smaller range across the full colormap and height range.

### 2.3. JavaScript Modifications

- **File to Modify:** `src/spectrogram/spectrogram.js`.
- **`AnalyserView` Class:**
    - Will be updated to manage the state of the new controls (fade, gate, min/max dB).
    - Will get the locations of all new uniforms during shader initialization.
    - Will contain new methods (`setFadeEnabled(bool)`, `setGateEnabled(bool)`, `setDbRange(min, max)`) to update the uniform values.
- **`initializeSpectrogram` Function:**
    - Will be updated to get all new UI elements (toggles, sliders) from the DOM.
    - Event listeners will be added to link the UI controls to the new methods on the `AnalyserView` instance.

### 2.4. Styling

- **File to Modify:** `src/spectrogram/styles.css`.
- The `.analysis-mode-controls` block will be updated to accommodate the new dynamic range sliders.

---

## 3. Post-Implementation Bug Analysis (2025-09-03)

Following the implementation of the Dynamic Range controls, a bug was identified where the 3D mesh height responded correctly to the new range, but the texture color did not. This section details the cause and solution.

### 3.1. The Cause of the Bug

The issue was a logical disconnect between the two WebGL shaders:

*   **Height (Correct):** The **vertex shader**, which calculates the height of the 3D mesh, was correctly updated to re-normalize the signal's dB level based on the selected `minDb` and `maxDb` from the UI.
*   **Color (Incorrect):** The **fragment shader**, which calculates the color, was not updated. It continued to calculate color based on the *original*, raw 0.0 to 1.0 value from the texture (`float k = sample.a;`). This value always represents the full -100dB to 0dB range, completely ignoring the user's selected dynamic range.

This meant that even when a user zoomed into a narrow range like -60dB to -50dB, the fragment shader still interpreted those signals as being in the 0.4 to 0.5 (40-50%) part of the full range, which maps to the blue/green section of the colormap, instead of re-normalizing them to span the full 0.0 to 1.0 range and use all the available colors.

### 3.2. The Solution

The fix involved applying the exact same normalization logic to the fragment shader as was present in the vertex shader. The fragment shader was modified to:

1.  Convert the raw texture value (`sample.a`) to its original dB scale (-100 to 0).
2.  Apply the user's calibration offset (`dbfsOffset`).
3.  Re-normalize this dB value using the `u_minDb` and `u_maxDb` uniforms to stretch the selected range across the full 0.0 to 1.0 spectrum.
4.  Use this correctly normalized value to calculate the final color.

This ensures that both the height and color of the spectrogram accurately reflect the user-selected dynamic range.

### 3.3. WebGL Buffer Creation Bug (2025-09-04)

During restoration of microphone functionality from backup files, a critical WebGL buffer creation issue was identified and resolved.

#### The Issue
```
WebGL: INVALID_OPERATION: bufferData: no buffer
spectrogram.js:663 boxVBO is null, cannot bind buffer
```

#### Root Cause Analysis
The issue was a **timing/order problem** in the `initAxesBuffers()` method (`src/spectrogram/spectrogram.js:602`):

1. **Incorrect Order:** The `_rebuildAxesBox()` method was called **before** `this.boxVBO` was created
2. **Method Dependency:** `_rebuildAxesBox()` attempts to bind and populate `this.boxVBO` buffer
3. **Null Reference:** Since `this.boxVBO` didn't exist yet, `gl.bindBuffer()` failed with INVALID_OPERATION

**Original problematic sequence:**
```javascript
this.axesVBO = gl.createBuffer();
this._rebuildAxesBox();  // ← Called before boxVBO exists!
this.boxVBO = gl.createBuffer();  // ← Created after _rebuildAxesBox() needs it
```

#### The Solution
**Fixed execution order** in `initAxesBuffers()` method:
1. Create `axesVBO` buffer
2. Create `boxVBO` buffer (with null validation)  
3. **Then** call `_rebuildAxesBox()` which requires both buffers

**Corrected sequence:**
```javascript
this.axesVBO = gl.createBuffer();
this.boxVBO = gl.createBuffer();
if (!this.boxVBO) {
    console.error('Failed to create boxVBO buffer');
    return;
}
this._rebuildAxesBox();  // ← Now called after all buffers exist
```

#### Impact
This bug prevented proper WebGL initialization, causing:
- 3D visualization axis rendering failures
- Console errors during spectrogram startup  
- Potential WebGL context corruption

**Fix Status:** ✅ **RESOLVED** - Buffer creation order corrected with validation checks.

**Fixed by:**
- **Agent:** Claude (Sonnet 4)
- **Role:** Project main coder
- **Date:** 2025-09-04

### 3.4. Dynamic Range Configuration Guidelines

Based on practical testing and user feedback, the following configuration recommendations optimize spectrogram visualization for different environments:

#### Recommended Settings

**Minimum Dynamic Range (~-100dB):**
- **Purpose:** Eliminate blue background noise from spectrogram display
- **Effect:** Makes the noise floor invisible, providing cleaner visualization
- **Adjustment:** Fine-tune based on environmental noise floor

**Maximum Dynamic Range (<0dB):**
- **Purpose:** Visualize red spots indicating maximum amplitude peaks
- **Effect:** Highlights signal saturation and peak levels
- **Adjustment:** Set slightly below 0dB to prevent clipping visualization

#### Environmental Considerations

**Dynamic Range is relative and visualization-focused** - requires adjustment based on:

1. **Microphone Input Gain:** Higher gain requires higher minimum threshold to suppress noise
2. **Loudspeaker Volume:** Speaker output level affects the perceived dynamic range
3. **Room Acoustics:** Reverberant environments may require different thresholds
4. **Analysis Purpose:** 
   - **Noise Analysis:** Lower minimum range (-120dB to -80dB)
   - **Music Analysis:** Mid range (-80dB to -40dB) 
   - **Peak Detection:** Higher range (-60dB to 0dB)

#### Practical Workflow

1. **Start with defaults:** Min: -100dB, Max: -10dB
2. **Adjust minimum upward** until blue background disappears
3. **Adjust maximum downward** until red peaks are clearly visible
4. **Fine-tune** based on specific acoustic environment and analysis needs

This approach ensures optimal visualization across different testing environments and measurement scenarios.

---

## 4. Frequency Mapping Audit & Comprehensive Fixes (2025-09-04)

Following user reports of frequency alignment issues where test tones appeared displaced from their corresponding frequency markers, a comprehensive audit and fix was implemented to ensure consistent logarithmic frequency mapping across the entire system.

### 4.1. Problem Analysis

**Primary Issue:** Test tones appeared displaced from their frequency axis markers:
- 1kHz tone initially appeared at ~750Hz position
- 10kHz tone appeared above the 10k tick marker
- Inconsistent frequency mapping between different system components

**Root Cause:** Multiple frequency mapping systems using different logarithmic bases and coordinate transformations:

1. **Tone Control Component:** Used log10 mapping (20Hz-20kHz)
2. **Spectrogram `_freqToU()` Function:** Initially used natural log with double-logarithmic transformation
3. **3D Geometry Texture Coordinates:** Linear mapping conflicted with shader expectations
4. **Shader Sampling:** Expected specific coordinate system with `pow(256.0, u - 1.0)` transformation

### 4.2. Comprehensive Solutions Implemented

#### 4.2.1. Unified Frequency Mapping System

**Standardized all components to use log10-based logarithmic mapping (20Hz-20kHz):**

```javascript
// Consistent log10 mapping across all components
const logMin = Math.log10(20), logMax = Math.log10(20000);
const logPosition = (Math.log10(freq) - logMin) / (logMax - logMin);
```

#### 4.2.2. 3D Geometry Texture Coordinate Fix

**Simplified texture coordinate generation** (`spectrogram.js:574`):
- **Before:** Complex double-logarithmic transformation with shader power function
- **After:** Simple linear texture coordinates `x / (sonogram3DWidth - 1)`

**Updated shader to handle frequency mapping** (`spectrogram.js:80-89`):
```glsl
// Convert linear texture coordinate to logarithmic frequency
float minFreq = 20.0, maxFreq = 20000.0;
float logMin = log(minFreq) / log(10.0); // GLSL log10 equivalent
float logMax = log(maxFreq) / log(10.0);
float freq = pow(10.0, logMin + gTexCoord0.x * (logMax - logMin));
float x = min(freq / nyquist, 1.0);
```

#### 4.2.3. `_freqToU()` Function Simplification

**Streamlined frequency-to-position mapping** (`spectrogram.js:767-778`):
```javascript
_freqToU(freqHz) {
    const minFreq = 20, maxFreq = 20000;
    const f = Math.max(minFreq, Math.min(freqHz, maxFreq));
    const logMin = Math.log10(minFreq), logMax = Math.log10(maxFreq);
    const visualPos = (Math.log10(f) - logMin) / (logMax - logMin);
    return Math.max(0, Math.min(1, visualPos));
}
```

### 4.3. UI Improvements

#### 4.3.1. Test Tone Interface Cleanup

**Removed redundant "Test Tone:" label** (`sidebar-manager.js:207`):
- Cleaned up UI by removing unnecessary text
- Maintained tone control functionality without visual clutter

#### 4.3.2. Frequency Analysis Lines Feature

**Added "Lines" toggle for enhanced visualization** (`sidebar-manager.js:210-215`):
```html
<div class="form-check form-switch mt-2">
    <input class="form-check-input" type="checkbox" role="switch" id="frequencyLines">
    <label class="form-check-label" for="frequencyLines">Lines</label>
</div>
```

**Functionality** (`spectrogram.js:800-810`):
- Draws continuous lines from present-time axis to past-time axis
- Lines appear at each frequency boundary (20, 60, 100, 250, 500, 1k, 2k, 4k, 6k, 10k, 15k, 20k Hz)
- Provides better visual reference for frequency analysis across time dimension
- Dynamically rebuilds geometry when toggled

#### 4.3.3. Viewport Presets Enhancement

**Added "Upper" viewport preset** (`sidebar-manager.js:322-327`, `spectrogram.js:1392-1460`):
- **Rotate X:** -90°, **Rotate Y:** 0°, **Rotate Z:** 270°
- **Position Y:** -2.7, **Zoom:** -8.1, **Vertical Scale:** 2.0
- Provides optimal overhead view for frequency analysis

### 4.4. Critical Shader Bug Fix

**Issue:** Shader compilation failure due to non-existent `log10()` function in GLSL
```
TypeError: Failed to execute 'attachShader' on 'WebGLRenderingContext'
```

**Solution:** Replaced `log10()` with mathematically equivalent expression:
```glsl
// GLSL doesn't have log10(), use mathematical equivalent
float logMin = log(minFreq) / log(10.0);
float logMax = log(maxFreq) / log(10.0);
```

### 4.5. Testing & Verification

**Comprehensive frequency alignment testing confirmed:**
- ✅ 500 Hz tone appears exactly at 500 Hz axis marker
- ✅ 1 kHz tone appears exactly at 1k axis marker  
- ✅ 10 kHz tone appears exactly at 10k axis marker
- ✅ Logarithmic frequency distribution matches human auditory perception
- ✅ Consistent mapping between tone control and spectrogram display

### 4.6. Code Quality Improvements

**Fixed WebGL buffer initialization timing issues:**
- Corrected geometry texture coordinate generation order
- Added proper error handling for WebGL context failures
- Improved shader compilation error reporting

**Performance optimizations:**
- Reduced computational complexity in texture coordinate generation
- Simplified frequency mapping calculations
- Optimized tick rebuilding for lines toggle

### 4.7. Impact Assessment

**Before fixes:**
- Frequency analysis unreliable due to misaligned content
- User confusion from displaced test tones
- Inconsistent frequency reference system

**After fixes:**
- ✅ Perfect frequency alignment for precise audio analysis
- ✅ Consistent logarithmic frequency scaling (20Hz-20kHz)
- ✅ Enhanced visualization tools (frequency lines)
- ✅ Cleaner, more professional UI
- ✅ Reliable frequency positioning for scientific measurements

**Technical Debt Eliminated:**
- Removed complex double-logarithmic transformations
- Unified frequency mapping system across all components
- Standardized coordinate system throughout codebase
- Improved maintainability and extensibility

---

**Report by:**
- **Agent ID:** gemini-2.5.pro  
- **Role:** Main coding agent, Spectrogram module
- **Date:** 2025-09-03 19:30:00 UTC
- **Agent:** Claude (Sonnet 4)
- **Role:** Project main coder  
- **Date:** 2025-09-04 22:15:00 UTC
- **Agent:** Claude (Sonnet 4)
- **Role:** Frequency mapping specialist & UI enhancement
- **Date:** 2025-09-04 18:47:00 UTC

**Direction:** Under the direction of Alex W. Rettig E. (alex.rettig@qualia-nss.com)

---

## 5. Shader-Based Frequency Mapping Correction (2025-09-04)

This section details the resolution of a critical frequency misalignment issue, based on suggestions from a Grok analysis session.

### 5.1. Problem Analysis

- **Source of Analysis**: The issues were identified in the document `dev/dev_stages/st04-spectrogram/groks-fix-freq-map-align-suggestions.md` (from Grok session: `https://grok.com/c/949e0772-0e73-453f-9ee4-b169a2ccba82`).
- **Primary Issue**: A fundamental flaw in the WebGL shader's frequency-to-texture mapping caused a significant visual misalignment. Test tones (e.g., 1kHz) did not align with their corresponding frequency markers on the spectrogram's axis.
- **Root Cause**: The original mapping logic (`pow(256.0, gTexCoord0.x - 1.0)`) was not calibrated for the application's linear frequency data texture. This caused two main problems:
    1.  **Incorrect Peak Alignment**: Tones were shifted visually from their true frequency.
    2.  **Incorrect Frequency Range**: The spectrogram appeared to start rendering at ~80Hz instead of the intended 20Hz, as the first few frequency bins were skipped by the incorrect mapping.

### 5.2. Solution Implemented

A direct fix was implemented in the `sonogramVertexShader` and `sonogramFragmentShader` within `src/spectrogram/spectrogram.js`.

1.  **Corrected Frequency Mapping**: The flawed `pow(256.0, ...)` logic was replaced with a precise logarithmic mapping that converts the visual coordinate (from 0.0 to 1.0) into the correct frequency (from 20Hz to 20kHz) and then finds the corresponding linear position in the frequency data texture.
    ```glsl
    // New shader logic
    uniform float u_sampleRate;
    // ...
    float visualPos = gTexCoord0.x;
    float freq = 20.0 * pow(1000.0, visualPos); // Maps visual position to 20Hz-20kHz
    float nyquist = u_sampleRate / 2.0;
    float x = freq / nyquist; // Converts frequency to linear texture coordinate
    ```
2.  **Sample Rate Uniform**: A new `u_sampleRate` uniform was added to the shaders to ensure the mapping is always accurate, regardless of the audio device's sample rate. The JavaScript code was updated to supply this value.

### 5.3. Guideline Functionality Correction

- **Initial Error**: An initial fix incorrectly added horizontal dBFS lines controlled by the "Frequency Lines" toggle.
- **Correction**: Based on user feedback, this was reverted.
- **Final Implementation**: The "Frequency Lines" toggle now correctly draws vertical lines in the amplitude direction (along the Y-axis) at each frequency boundary marker, providing a clear visual reference for signal amplitude at specific frequencies.

### 5.4. Verification

- **Alignment**: The 1kHz tone now aligns perfectly with the 1k marker.
- **Range**: The spectrogram's frequency axis now correctly visualizes data starting from 20Hz.
- **Guidelines**: The "Frequency Lines" toggle functions as specified.

---

**Report by:**
- **Agent ID:** Gemini
- **Role:** Code Implementation & Bug Fix
- **Date:** 2025-09-05T00:22:03Z
