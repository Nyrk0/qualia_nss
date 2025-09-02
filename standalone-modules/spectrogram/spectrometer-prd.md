# Product Requirements Document: Standalone Spectrogram Web App

## 1. Overview

This document outlines the requirements and development process for refactoring the Chrome Music Lab Spectrogram into a minimal, standalone, single-page web application. The primary goal is to create a dependency-free tool focused exclusively on real-time 3D spectrogram visualization from microphone input.

## 2. Core Requirements

- **Standalone SPA**: The application must be a single HTML file with embedded or linked JavaScript and CSS, requiring no server or build process.
- **Microphone Input Only**: The sole audio source will be the user's microphone, requiring explicit user permission.
- **File Protocol Support**: The application must run correctly when opened directly from the local filesystem (`file://` protocol).
- **No External Dependencies**: All code, including shaders and libraries, must be consolidated. Dependencies on frameworks like jQuery are removed.
- **Minimal UI**: The user interface should be clean, with controls limited to essential visualization parameters.

## 3. Refactoring and Architecture (v1 & v2)

### 3.1. Code Consolidation

- **Source Analysis**: Analyzed the original Chrome Music Lab project to identify essential modules: `main.js`, `UI/player.js`, `3D/visualizer.js`, `3D/matrix4x4.js`, and `3D/cameracontroller.js`.
- **File Creation**: Created `index-gemini.html` and `spectrogram-gemini.js` to house the refactored application.
- **Shader Inlining**: All GLSL vertex and fragment shaders were embedded as multiline strings within the JavaScript to eliminate external file requests.
- **JavaScript Consolidation**: The logic from the identified modules was combined into a single `spectrogram-gemini.js` file, organized into classes:
    - `Player`: Manages the Web Audio API context and microphone stream.
    - `AnalyserView`: Handles all WebGL rendering, including geometry, shaders, and the main render loop.
    - `Matrix4x4`: A utility class for 3D transformations.
    - `CameraController`: Manages camera rotation and position state.

### 3.2. Feature Implementation

- **3D Visualization**: The core feature is a 3D "terrain" spectrogram where:
    - **X-Axis**: Represents frequency.
    - **Z-Axis**: Represents time.
    - **Y-Axis**: Represents the amplitude of a given frequency at a moment in time.
- **Camera & Projection**: The scene uses a **perspective projection**, which is crucial for creating the 3D depth effect by making objects further from the camera appear smaller. The interpretation of this effect depends on the camera's orientation. For instance, in a side view, the time axis recedes into the distance. In a top-down (plane) view, lower-amplitude (dBFS) areas of the 'terrain' are further away, while high-amplitude peaks appear closer. This spatial depth, combined with color mapping, aids in interpreting the sound's structure. An alternative, **orthographic projection**, would render a flat 2D chart, removing the perception of depth regardless of camera angle.
- **Interactive Controls (v2)**: A UI sidebar was added with sliders for real-time control over:
    - Camera Rotation (X, Y, Z)
    - Camera Position (Y, Z/Zoom)
    - Vertical Scale (Amplitude)
- **Coordinate Logging (v2)**: Implemented a raycasting mechanism to detect clicks on the spectrogram plane. The calculated 3D world coordinates (X, Z) are logged to the developer console.
- **Audio Feedback Fix**: The connection from the audio analyser to the output destination was removed to prevent the microphone input from being played back, eliminating feedback loops.

## 4. Requirements for v3

- **UI Value Readouts**: The UI will be updated to display the current numerical value of each control slider, providing immediate feedback.
- **Canvas Controls**: Add controls for dynamically adjusting the canvas dimensions (width, height) and position (top, left), allowing the spectrogram to be resized and moved within the browser window.

## 5. Future Requirements (Post-v3)

- **Time-Span Control**: Implement a control to increase or decrease the time history displayed in the spectrogram. This will involve dynamically resizing the underlying WebGL texture.
- **Visual Aids for Analysis**:
    - **Axes and Labels**: Render X, Y, and Z axes that adapt to the camera's orientation.
        - **X-Axis**: Frequency, labeled in Hz on a logarithmic scale (20Hz to 20kHz).
        - **Z-Axis**: Time, labeled in seconds (s).
        - **Y-Axis**: Amplitude, labeled in dBFS.
    - **Color Map Legend**: Display a vertical bar with the spectrogram's color gradient, mapping colors to their corresponding dBFS values to aid in amplitude interpretation.
