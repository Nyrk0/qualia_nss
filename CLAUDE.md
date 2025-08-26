# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a web-based audio analysis toolkit consisting of three main applications:
- `7band-level-meter/` - Real-time 7-band audio level meter with calibration
- `spectogram/` - **3D WebGL spectrogram** based on Google Chrome Music Lab with 2D fallback
- `spectrum-analyzer/` - Real-time spectrum analysis tool
- `comb-filtering/` - JavaScript library for detecting comb-filtering artifacts using cepstrum analysis

## Architecture

### Frontend Structure
Each application is a standalone web app with its own directory containing:
- `index.html` - Main application page
- `script.js` - Core JavaScript functionality  
- `style.css` - Application styling

### Audio Processing
All applications use Web Audio API for real-time audio processing:
- Microphone input via `getUserMedia()`
- File/sample playback support
- Real-time FFT analysis with configurable window sizes
- Frequency domain processing and visualization

### Core Components
- **7-band Level Meter**: Multi-band RMS level monitoring with peak detection and calibration
- **3D Spectrogram**: Google Chrome Music Lab implementation with WebGL 3D visualization, HSV color mapping, and 2D canvas fallback
- **Spectrum Analyzer**: Real-time frequency spectrum display
- **Comb Filter Library**: ES6 module for detecting acoustic comb filtering using cepstrum analysis

## Development Notes

### No Build Process
This project uses vanilla JavaScript with ES6 modules - no build tools, package managers, or compilation required. Files can be opened directly in a browser or served via any static web server.

### Testing
Applications are tested by opening `index.html` files in a web browser. Each app includes:
- Device selection for audio input
- Error handling and status displays
- Real-time visual feedback

### Deployment
See `docs/deployment-workflows.md` for deployment options including:
- GitHub Actions with SFTP/FTPS sync
- rsync over SSH
- VS Code extensions for file sync
- cPanel Git integration

## 3D Spectrogram Implementation

### WebGL 3D Visualization
The spectrogram now features Google Chrome Music Lab's exact 3D implementation:
- **256x256 mesh** with vertex texture sampling for real-time height mapping
- **3D coordinate system**: X-axis (time), Y-axis (amplitude), Z-axis (frequency 20Hz-20kHz logarithmic)
- **HSV color mapping**: 360° → 0° hue progression for rainbow effect
- **Matrix4x4 math**: Google's camera system with mouse rotation controls
- **WebGL shaders**: Direct ports of Google's vertex/fragment shaders

### Technical Architecture
- **WebGL3DRenderer class**: Complete 3D rendering pipeline
- **Logarithmic frequency mapping**: Google's `pow(256.0, texCoord.x - 1.0)` formula
- **Rolling texture buffer**: Time-series audio data storage
- **Automatic fallback**: Graceful degradation to 2D canvas if WebGL unsupported

### Usage
- Click "3D View" to enable WebGL 3D visualization
- Mouse drag to rotate camera around 3D mesh
- Audio amplitude creates height-mapped terrain
- HSV colors indicate intensity levels

### Browser Requirements
- WebGL support with vertex texture sampling capability
- Detected automatically with fallback to 2D mode

## Audio Analysis Features

### Comb-Filtering Detection
The `comb-filtering/` library provides sophisticated audio analysis:
- Cepstrum-based detection algorithm
- Configurable frequency ranges and delay detection
- Confidence scoring and temporal smoothing
- ES6 module structure with comprehensive API

### Cross-App Navigation
Applications include header navigation linking between tools for integrated workflow.

## File Structure Notes

- `docs/` contains analysis documentation and deployment guides
- `snd/` directory in spectrogram contains sample audio files
- No package.json or build configuration files
- Uses browser-native ES6 module imports