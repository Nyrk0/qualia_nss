# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a professional web-based audio analysis toolkit featuring a **fully modular architecture**. The application consists of integrated analysis modules:
- `spectrogram/` - **3D WebGL spectrogram** with advanced sidebar controls (✅ **Fully Integrated**)
- `7band-level-meter/` - Real-time 7-band audio level meter with calibration
- `spectrum-analyzer/` - Real-time spectrum analysis tool
- `comb-filtering/` - JavaScript library for detecting comb-filtering artifacts using cepstrum analysis

## Modular Architecture

### Core Architecture (✅ COMPLETED - Stage 01)
The application has been refactored from monolithic files into a modular system:

**JavaScript Modules** (`src/js/`):
- `app-core.js` - Core initialization, theme management, global stubs (~40 lines)
- `ui-utils.js` - UI utilities, scroll-fade effects (~50 lines)  
- `sidebar-manager.js` - Advanced Bootstrap accordion sidebar templates (~150 lines)
- `module-loader.js` - Dynamic module loading, lifecycle management (~200 lines)
- `navigation.js` - Navigation state, routing, active states (~120 lines)

**CSS Modules** (`src/styles/`):
- `core.css` - CSS variables, fonts, typography (~70 lines)
- `layout.css` - Main content, sidebar, grid layouts (~120 lines)
- `navigation.css` - Header, navbar, theme toggle (~180 lines)
- `components.css` - UI components, forms, controls (~200 lines)
- `utilities.css` - Scroll effects, helper classes (~50 lines)
- `responsive.css` - Media queries, mobile adaptations (~60 lines)
- `modules/` - Module-specific styles with proper namespacing

**Loading Order Dependencies**: Files must be loaded in specific order - see `dev_directives/modular_architecture_guide.md`

## Architecture

### Frontend Structure
The application uses a **modular Single Page Application (SPA)** architecture:

**Main Shell**:
- `index.html` - Application entry point with unified interface
- Modular JS/CSS loading system with dependency management
- Dynamic module loading with lifecycle management

**Module Structure** (integrated modules):
- `src/spectrogram/` - HTML fragment + modular JavaScript
- Template-based loading via `module-loader.js`
- Advanced Bootstrap accordion sidebars via `sidebar-manager.js`

**Legacy Structure** (standalone modules in `/modules/` - being migrated):
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

## 3D Spectrogram Implementation (✅ FULLY INTEGRATED)

### Modular Integration
The spectrogram has been **fully integrated** into the modular architecture:
- **HTML Fragment**: `src/spectrogram/index.html` - Canvas container and legends only
- **Modular JavaScript**: `src/spectrogram/spectrogram.js` - Exports `initializeSpectrogram()` function
- **Advanced Sidebar**: Bootstrap accordion with organized control sections
- **Module Loader**: Special handling in `module-loader.js` for initialization

### Advanced Sidebar Features
**Bootstrap Accordion Sections**:
- **Experiment Setup** - Audio source selection (wet/dry), microphone DSP options
- **Camera Controls** - 3D rotation (X/Y/Z), position, zoom controls  
- **Visual Controls** - Vertical scale, dBFS calibration offset
- **Scroll-Fade Effects** - Professional UI with gradient fade on overflow

### WebGL 3D Visualization  
The spectrogram features Google Chrome Music Lab's exact 3D implementation:
- **256x256 mesh** with vertex texture sampling for real-time height mapping
- **3D coordinate system**: X-axis (frequency), Y-axis (amplitude), Z-axis (time)
- **HSV color mapping**: 360° → 0° hue progression for rainbow effect
- **Matrix4x4 math**: Google's camera system with mouse rotation controls
- **WebGL shaders**: Direct ports of Google's vertex/fragment shaders

### Technical Architecture
- **WebGL3DRenderer class**: Complete 3D rendering pipeline
- **Logarithmic frequency mapping**: Google's `pow(256.0, texCoord.x - 1.0)` formula
- **Rolling texture buffer**: Time-series audio data storage
- **Automatic fallback**: Graceful degradation to 2D canvas if WebGL unsupported
- **Modular Initialization**: `window.initializeSpectrogram()` called by module loader

### Audio Processing Integration
- **Dual Source Support**: Microphone (wet) and system audio (dry) capture
- **Professional DSP Options**: Echo cancellation, noise suppression, auto gain control
- **Real-time Analysis**: FFT processing with configurable parameters
- **Calibrated Measurements**: dBFS offset adjustment for professional applications

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

### Current Modular Structure
- `src/js/` - Modular JavaScript architecture (5 files, ~560 lines total)
- `src/styles/` - Modular CSS architecture (8 files, ~720 lines total) 
- `src/spectrogram/` - Integrated spectrogram module with advanced sidebar
- `dev/dev_directives/` - Development guides and architecture documentation
- `dev/st01-modularization/` - Completed modularization strategy and results

### Legacy Structure (being migrated)
- `modules/` - Standalone applications being integrated into modular architecture
- `docs/` - Analysis documentation, deployment guides, and Chrome Music Lab reference  
- `assets/data/` - Sample audio files and SPL measurement data

### Build System
- **No build process required** - Pure web standards for maximum compatibility
- No package.json or build configuration files
- Uses browser-native ES6 module patterns with global namespace management
- Static hosting optimized - ready for CDN deployment