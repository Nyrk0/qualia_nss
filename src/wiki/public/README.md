# Qualia-NSS Wiki

Welcome to the comprehensive documentation for **Qualia-NSS: Near-field Speaker Simulator**, a professional web-based audio analysis toolkit for precision audio engineering and acoustic measurement applications.

## 🚀 Quick Navigation

### Getting Started
- **[Project Overview](project/overview.md)** - Learn about Qualia-NSS and its capabilities
- **[Technology Stack](technology-stack/dependencies.md)** - Technical foundation and dependencies
- **[Getting Started Guide](manual/getting-started.md)** - Quick setup and first steps

### Architecture Deep Dive
- **[JavaScript Module Architecture](modular-architecture/javascript-modules.md)** - Core module system
- **[Routing and Navigation](modular-architecture/routing-navigation.md)** - Navigation and URL management
- **[CSS Module Architecture](modular-architecture/css-modules.md)** - Styling and theme system

### Audio Analysis Modules
- **[Spectrogram Module](audio-analysis-modules/spectrogram.md)** - 3D WebGL visualization
- **[7-Band Level Meter](audio-analysis-modules/7band-level-meter.md)** - Psychoacoustic analysis
- **[Spectrum Analyzer](audio-analysis-modules/spectrum-analyzer.md)** - Frequency domain analysis
- **[Comb Filtering Detection](audio-analysis-modules/comb-filtering.md)** - Acoustic artifact detection
- **[SPL Curve Analysis](audio-analysis-modules/spl-analysis.md)** - Sound pressure level analysis

### UI Components
- **[Tone Control Component](ui-components/tone-control.md)** - Frequency generator interface
- **[Theme System](ui-components/theme-system.md)** - Dark/light mode management
- **[Navigation Controls](ui-components/navigation-controls.md)** - User interface navigation
- **[Sidebar Management](ui-components/sidebar-management.md)** - Dynamic sidebar system

### Audio Processing
- **[Web Audio API Integration](audio-processing/web-audio-api.md)** - Audio processing foundation
- **[FFT Analysis](audio-processing/fft-analysis.md)** - Frequency domain transformations
- **[DSP Controls](audio-processing/dsp-controls.md)** - Digital signal processing
- **[Audio Source Management](audio-processing/audio-sources.md)** - Input source handling

### Development
- **[Development Guidelines](development/guidelines.md)** - Best practices and standards
- **[Deployment & Production](deployment/production.md)** - Deployment strategies

### API Reference
- **[JavaScript API Reference](api-reference/javascript-api/module-loader.md)** - Complete API documentation
- **[CSS Custom Properties](api-reference/css-api.md)** - Styling API reference
- **[Module Interface Contracts](api-reference/module-contracts.md)** - Module development specifications

### Support
- **[Troubleshooting & FAQ](troubleshooting/faq.md)** - Common issues and solutions

## 🎵 What is Qualia-NSS?

Qualia-NSS (Near-field Speaker Simulator) is a sophisticated web-based audio analysis platform that brings professional-grade acoustic measurement tools directly to your browser. Built with modern web technologies, it provides real-time visualization and analysis capabilities for audio professionals, researchers, and enthusiasts.

### Key Features

- **🌈 3D WebGL Spectrogram** - Interactive 3D visualization of audio spectra
- **📊 7-Band Psychoacoustic Analysis** - Professional multi-band level monitoring
- **🔍 Comb Filtering Detection** - Advanced acoustic artifact identification
- **📈 SPL Curve Analysis** - Sound pressure level measurement and analysis
- **🎛️ Real-Time Processing** - Low-latency audio analysis pipeline
- **🎨 Professional UI** - Theme-aware interface with responsive design

### Architecture Highlights

- **Modular Design** - Clean separation of concerns with ES6+ modules
- **No Build System** - Direct browser execution without bundlers
- **WebGL Acceleration** - High-performance 3D graphics rendering
- **Web Audio API** - Professional audio processing capabilities
- **Static Hosting** - CDN-friendly deployment and distribution

## 🛠️ Quick Start

### Local Development
```bash
# Start HTTP server (required for full functionality)
python3 -m http.server 8080
# or
npx http-server -p 8080

# Open in browser
open http://localhost:8080
```

### File Access
Open `index.html` directly in your browser for basic functionality (some features require HTTP server).

## 📖 Documentation Structure

This wiki is organized into several main sections:

- **Project** - Overview and introduction
- **Technology** - Technical stack and dependencies
- **Architecture** - System design and module organization
- **Modules** - Individual audio analysis components
- **Components** - UI and shared components
- **Processing** - Audio processing pipeline
- **Development** - Guidelines and deployment
- **API** - Complete reference documentation
- **Support** - Troubleshooting and help

## 🔗 External Resources

- **[GitHub Repository](https://github.com/Nyrk0/qualia_nss)** - Source code and issues
- **[Live Demo](https://nyrk0.github.io/qualia_nss)** - Try Qualia-NSS online
- **[Development Blog](../manual/development.md)** - Development updates and insights

## 📋 Legacy Documentation

For reference, the following legacy documentation is still available:

- [API Documentation (Legacy)](API_README.md)
- [Architecture Overview (Legacy)](architecture/overview.md)
- [Development Guide (Legacy)](manual/development.md)
- [Getting Started (Legacy)](manual/getting-started.md)

---

**Built with ❤️ for the audio engineering community**

*Qualia-NSS pushes the boundaries of what's possible with web-based audio analysis, bringing professional tools to everyone with a modern browser.*
