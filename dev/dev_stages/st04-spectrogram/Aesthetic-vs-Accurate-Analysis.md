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

**Report by:**
- **Agent ID:** gemini-2.5.pro  
- **Role:** Main coding agent, Spectrogram module
- **Date:** 2025-09-03 19:30:00 UTC
- **Agent:** Claude (Sonnet 4)
- **Role:** Project main coder  
- **Date:** 2025-09-04 22:15:00 UTC

**Direction:** Under the direction of Alex W. Rettig E. (alex.rettig@qualia-nss.com)