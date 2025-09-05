# Qualia-NSS: Natural Surround Sound

A DIY psychoacoustic loudspeaker design toolkit providing web-based analysis tools for enthusiasts to create immersive stereo systems without DSP equipment or complex crossovers.

## Core Mission

**Creative Stereo Design Through Psychoacoustics**
- Research-driven speaker complementarity analysis
- Simple, proven cabinet designs (no crossovers)
- Budget optimization: speakers over electronics
- Immersive listening without DSP complexity

## Design Philosophy

### Speaker Selection Focus
- **Psychoacoustic Band Analysis**: 7-band monitoring for frequency response optimization
- **Complementarity Matching**: Tools to ensure left/right speaker synergy
- **Phase Alignment**: Detection of comb filtering and temporal artifacts
- **SPL Curve Analysis**: Real-world performance validation

### Simple Architecture
- **No Crossovers**: Full-range driver approach
- **Minimal Enclosures**: Focus on proven designs (sealed, ported, open-baffle)
- **Component Quality**: Budget allocation to driver selection and matching

## Analysis Tools for DIY Enthusiasts

### 1. **Psychoacoustic Analyzer** - Band Response Optimization
- Real-time 7-band analysis (Sub-bass, Bass, Low Mids, Mids, Upper Mids, Presence, Brilliance)
- Speaker placement and room interaction monitoring
- Frequency response curve generation

### 2. **Complementarity Matcher** - Stereo Pair Analysis
- Left/right channel comparison tools
- Phase coherence measurement
- Timbre matching validation

### 3. **Comb Filter Detector** - Acoustic Artifact Prevention
- Room reflection analysis
- Speaker placement optimization
- Standing wave identification

### 4. **SPL Measurement Suite** - Real-World Performance
- Upload professional SPL measurements
- Compare against DIY implementations
- Power response analysis

## Technical Architecture

**Web-Based Accessibility**: No expensive measurement equipment required
**Real-Time Feedback**: Instant analysis during speaker setup
**Modular Design**: Easy addition of new analysis modules
**Cross-Platform**: Works on any modern browser

## Psychoacoustic Research Integration

- **Fletcher-Munson Curves**: Perceptual frequency weighting
- **Critical Band Theory**: 7-band analysis foundation
- **Head-Related Transfer Functions**: Immersive positioning cues
- **Binaural Processing**: Stereo image optimization

This toolkit empowers DIY audiophiles to achieve professional-quality immersive listening through informed speaker design and precise acoustic measurements.

## Architecture and Project Structure

The application uses a **fully modular architecture** with a clear separation of concerns, making it maintainable and scalable. All modules leverage the **Web Audio API** for real-time processing.

Below is the consolidated project structure, serving as the single source of truth:

```
qualia-nss/
├── src/                    # Core modular application source
│   ├── js/                # Main JavaScript modules (loader, router, etc.)
│   ├── styles/            # Global and component-level CSS
│   ├── components/        # Reusable components (e.g., tone-control)
│   └── ...                # Other core component directories
├── standalone-modules/     # Self-contained feature modules with their own HTML/JS/CSS
│   ├── 7band-level-meter/ # Psychoacoustic multi-band analysis
│   ├── comb-filtering/    # Acoustic artifact detection
│   └── ...                # Other standalone tools
├── assets/                 # Static assets (e.g., sample data, images)
├── dev/                    # Development guides, rules, and todos
├── docs/                   # In-depth documentation and reports
├── api/                    # Backend API endpoints (e.g., health checks)
├── index.html              # Main application entry point
└── README.md               # This file
```

### Audio Processing Pipeline

All modules leverage the **Web Audio API** for real-time processing:
- Microphone input via `getUserMedia()` with DSP options
- File/sample playback support
- Real-time FFT analysis with configurable windowing
- Professional frequency domain processing and visualization

## Quick Start

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

## Audio Analysis Modules

### 1. **Spectrogram** - 3D WebGL Visualization
**Purpose**: Advanced real-time spectrogram with 3D visualization capabilities

**Features**:
- **WebGL 3D Rendering** - 256×256 mesh with vertex texture sampling
- **Professional Controls** - Rotation, zoom, amplitude scaling, dBFS calibration
- **Audio Source Options** - Microphone (wet) or system audio (dry) capture
- **DSP Controls** - Echo cancellation, noise suppression, auto gain control
- **Advanced Sidebar** - Bootstrap accordion with organized control sections

**Status**: **Fully Integrated** - Complete modular architecture integration

### 2. **7-Band Level Meter** - Psychoacoustic Monitoring
**Purpose**: Real-time multi-band RMS level monitoring with calibration

**Features**:
- Psychoacoustic frequency band analysis (Sub-bass to Brilliance)
- Peak detection and hold functionality
- Professional calibration capabilities
- Real-time visual feedback

**Status**: **Fully Integrated** - Complete modular architecture integration

### 3. **Spectrum Analyzer** - Frequency Analysis
**Purpose**: Real-time frequency spectrum visualization

**Features**:
- Configurable FFT sizes and windowing functions
- Logarithmic frequency scaling (20Hz - 20kHz)
- Real-time amplitude and phase analysis

**Status**: **Functional** - Ready for modular integration

### 4. **Comb-Filtering Detection** - Acoustic Analysis
**Purpose**: Professional acoustic artifact detection

**Features**:
- Cepstrum-based detection algorithm
- Configurable frequency ranges and delay detection
- Confidence scoring and temporal smoothing
- ES6 module structure with comprehensive API

**Status**: **Standalone Module** - Available in `/standalone-modules/comb-filtering/`

### 5. **Additional Modules** - Professional Tools
- **Filters** - Audio filter design and analysis
- **Cabinets** - Speaker cabinet modeling tools  
- **Tests** - Audio measurement and testing suite

**Status**: **Fully Integrated** - Complete modular architecture with working functionality

## User Interface

### Modern Professional Design
- **Responsive Layout** - Optimized for desktop, tablet, and mobile
- **Dark/Light Themes** - Professional color schemes with smooth transitions
- **Advanced Sidebars** - Bootstrap accordion controls with scroll-fade effects
- **Interactive Controls** - Real-time parameter adjustment with visual feedback

### Navigation
- **Unified Interface** - Seamless switching between analysis modules
- **State Persistence** - Settings and preferences saved across sessions
- **Keyboard Shortcuts** - Professional workflow optimization

## Technology Stack

- **Frontend**: Vanilla JavaScript (ES6+) with modular architecture
- **UI Framework**: Bootstrap 5 (CSS-only) + Bootstrap Icons
- **Audio Processing**: Web Audio API with custom FFT implementations
- **3D Graphics**: WebGL 2.0 with WebGL 1.0 fallback
- **Build System**: None - Pure web standards for maximum compatibility
- **Deployment**: Static hosting optimized for CDN delivery

## Development

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

## Deployment

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

## Audio Analysis Capabilities

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

## Contributing

This project uses a **staged development methodology** with comprehensive documentation:

1. **Review Architecture** - See `dev/RULES/03_ARCHITECTURE_GUIDE.md`
2. **Follow Safe Development** - Backup and incremental development practices
3. **Module Integration** - Use established patterns for new modules
4. **Testing** - Validate across browsers and audio devices

## License

This project is developed for professional audio analysis applications. See individual module directories for specific licensing information.

## Links

- **Documentation** - Complete guides in `/dev/RULES/`
- **Sample Data** - Audio samples and SPL curves in `/assets/data/`

## References

The 3D spectrogram implementation is based on the work found in Google's Chrome Music Lab. The original resource is preserved in the `/docs/chrome-music-lab/` directory for historical context.

- Google. (n.d.). *Spectrogram*. Chrome Music Lab. Retrieved from https://musiclab.chromeexperiments.com/Spectrogram/

---

*Professional web-based audio analysis toolkit built with modern web technologies and modular architecture principles.*
