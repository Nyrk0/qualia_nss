# Qualia-NSS: Near-field Speaker Simulator

A professional web-based audio analysis toolkit providing real-time visualization and measurement capabilities for audio engineering applications. Built with modular architecture and modern web technologies for precision audio analysis.

## ✨ Features

- **🎛️ Real-Time 7-Band Psychoacoustic Analysis** - Professional audio monitoring across critical frequency bands
- **🌈 3D WebGL Spectrogram Visualization** - Advanced 3D spectrogram based on Google Chrome Music Lab with interactive controls
- **📊 Spectrum Analysis** - Real-time frequency domain analysis with configurable parameters
- **🔍 Comb Filtering Detection** - Sophisticated acoustic artifact detection using cepstrum analysis
- **📈 SPL Curve Analysis** - Upload and analyze Sound Pressure Level data from measurement equipment
- **🎨 Advanced UI** - Professional interface with accordion sidebars, theme system, and responsive design

## 🏗️ Architecture

### Modular Frontend Architecture

The application uses a **fully modular architecture** with separate concerns:

```
src/
├── js/                     # JavaScript modules
│   ├── app-core.js        # Core initialization & theme management
│   ├── ui-utils.js        # UI utilities & scroll effects  
│   ├── sidebar-manager.js # Advanced sidebar templates
│   ├── module-loader.js   # Dynamic module loading
│   └── navigation.js      # Navigation & routing
├── styles/                # CSS modules
│   ├── core.css          # Variables, fonts, typography
│   ├── layout.css        # Main content & sidebar layouts
│   ├── navigation.css    # Header & navbar styling
│   ├── components.css    # UI components & forms
│   ├── utilities.css     # Helper classes & effects
│   ├── responsive.css    # Media queries & mobile
│   └── modules/          # Module-specific styles
└── spectrogram/          # Integrated spectrogram module
    ├── index.html        # HTML fragment
    └── spectrogram.js    # WebGL 3D implementation
```

### Audio Processing Pipeline

All modules leverage the **Web Audio API** for real-time processing:
- Microphone input via `getUserMedia()` with DSP options
- File/sample playback support
- Real-time FFT analysis with configurable windowing
- Professional frequency domain processing and visualization

## 🚀 Quick Start

### Option A: HTTP Server (Recommended)

```bash
# Python
python3 -m http.server 8080

# Node.js
npx http-server -p 8080

# Then open: http://localhost:8080/
```

### Option B: Direct File Access

- Open `index.html` directly in your browser
- Modules include CORS-safe fallbacks for local development
- Some features may require HTTP server for full functionality

## 🧩 Audio Analysis Modules

### 1. 🎛️ **Spectrogram** - 3D WebGL Visualization
**Purpose**: Advanced real-time spectrogram with 3D visualization capabilities

**Features**:
- **WebGL 3D Rendering** - 256×256 mesh with vertex texture sampling
- **Professional Controls** - Rotation, zoom, amplitude scaling, dBFS calibration
- **Audio Source Options** - Microphone (wet) or system audio (dry) capture
- **DSP Controls** - Echo cancellation, noise suppression, auto gain control
- **Advanced Sidebar** - Bootstrap accordion with organized control sections

**Status**: ✅ **Fully Integrated** - Complete modular architecture integration

### 2. 📊 **7-Band Level Meter** - Psychoacoustic Monitoring
**Purpose**: Real-time multi-band RMS level monitoring with calibration

**Features**:
- Psychoacoustic frequency band analysis (Sub-bass to Brilliance)
- Peak detection and hold functionality
- Professional calibration capabilities
- Real-time visual feedback

**Status**: ✅ **Functional** - Ready for modular integration

### 3. 📈 **Spectrum Analyzer** - Frequency Analysis
**Purpose**: Real-time frequency spectrum visualization

**Features**:
- Configurable FFT sizes and windowing functions
- Logarithmic frequency scaling (20Hz - 20kHz)
- Real-time amplitude and phase analysis

**Status**: ✅ **Functional** - Ready for modular integration

### 4. 🔍 **Comb-Filtering Detection** - Acoustic Analysis
**Purpose**: Professional acoustic artifact detection

**Features**:
- Cepstrum-based detection algorithm
- Configurable frequency ranges and delay detection
- Confidence scoring and temporal smoothing
- ES6 module structure with comprehensive API

**Status**: ✅ **Library Ready** - Available for integration

### 5. 🎚️ **Additional Modules** - Professional Tools
- **Filters** - Audio filter design and analysis
- **Cabinets** - Speaker cabinet modeling tools  
- **Tests** - Audio measurement and testing suite

**Status**: 🚧 **In Development** - UI templates ready

## 🎨 User Interface

### Modern Professional Design
- **Responsive Layout** - Optimized for desktop, tablet, and mobile
- **Dark/Light Themes** - Professional color schemes with smooth transitions
- **Advanced Sidebars** - Bootstrap accordion controls with scroll-fade effects
- **Interactive Controls** - Real-time parameter adjustment with visual feedback

### Navigation
- **Unified Interface** - Seamless switching between analysis modules
- **State Persistence** - Settings and preferences saved across sessions
- **Keyboard Shortcuts** - Professional workflow optimization

## 🛠️ Technology Stack

- **Frontend**: Vanilla JavaScript (ES6+) with modular architecture
- **UI Framework**: Bootstrap 5 (CSS-only) + Bootstrap Icons
- **Audio Processing**: Web Audio API with custom FFT implementations
- **3D Graphics**: WebGL 2.0 with WebGL 1.0 fallback
- **Build System**: None - Pure web standards for maximum compatibility
- **Deployment**: Static hosting optimized for CDN delivery

## 📁 Project Structure

```
qualia-nss/
├── src/                    # Modular application source
│   ├── js/                # JavaScript modules  
│   ├── styles/            # CSS modules
│   └── spectrogram/       # Integrated spectrogram
├── modules/               # Legacy standalone modules
│   ├── 7band-level-meter/ # Multi-band analysis
│   ├── spectrum-analyzer/ # Frequency analysis
│   └── comb-filtering/    # Artifact detection
├── docs/                  # Documentation & samples
├── assets/                # Sample data & resources
├── dev/                   # Development documentation
│   ├── st01-modularization/ # Modularization strategy
│   └── dev_directives/    # Development methodologies
├── index.html             # Application entry point
├── CLAUDE.md              # AI development guidance
└── CHANGELOG.md           # Project history
```

## 🔧 Development

### Architecture Benefits
- **Maintainability** - Clear separation of concerns across 13+ modular files
- **Performance** - Optimized loading, better caching, HTTP/2 ready
- **Scalability** - Easy addition of new modules without affecting existing code
- **Collaboration** - Multiple developers can work on different aspects simultaneously

### Development Workflow
- **Safe Development** - Backup strategies and incremental development
- **Staged Methodology** - Clear phases with rollback capabilities
- **Comprehensive Documentation** - Architecture guides and development directives
- **Testing** - Module lifecycle validation and cross-browser compatibility

## 🚀 Deployment

### Production Ready
- **Static Hosting** - Optimized for CDN deployment
- **GitHub Actions** - Automated deployment pipelines available
- **Domain Ready** - Configured for `qualia-nss.com`
- **Security** - `.htaccess` configuration for static hosting security

### Browser Requirements
- **Modern Browsers** - Chrome, Firefox, Safari, Edge (recent versions)
- **WebGL Support** - Required for 3D spectrogram visualization
- **Web Audio API** - For real-time audio processing
- **ES6+ Support** - Modern JavaScript features

## 📊 Audio Analysis Capabilities

### Professional Features
- **Real-Time Processing** - Low-latency audio analysis pipeline
- **Multiple Input Sources** - Microphone, line input, system audio capture
- **Precision Measurement** - Professional-grade dBFS scaling and calibration
- **Data Export** - Analysis results and visualizations
- **Sample Data** - Included frequency curves and SPL measurements

### Technical Specifications
- **Frequency Range** - 20Hz to 20kHz (full audio spectrum)
- **Dynamic Range** - -100 to 0 dBFS measurement capability
- **FFT Sizes** - Configurable from 512 to 8192 samples
- **Sampling Rates** - Auto-detection with device capability matching

## 🤝 Contributing

This project uses a **staged development methodology** with comprehensive documentation:

1. **Review Architecture** - See `dev_directives/modular_architecture_guide.md`
2. **Follow Safe Development** - Backup and incremental development practices
3. **Module Integration** - Use established patterns for new modules
4. **Testing** - Validate across browsers and audio devices

## 📜 License

This project is developed for professional audio analysis applications. See individual module directories for specific licensing information.

## 🔗 Links

- **Documentation** - Complete guides in `/dev/dev_directives/`
- **Sample Data** - Audio samples and SPL curves in `/assets/data/`
- **Chrome Music Lab Reference** - `/docs/chrome-music-lab/` (for 3D spectrogram implementation)

---

*Professional web-based audio analysis toolkit built with modern web technologies and modular architecture principles.*