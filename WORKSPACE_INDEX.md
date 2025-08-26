# Qualia NSS Workspace Index

## Project Planning & Design
This section contains key documents for project planning, architecture, and UI/UX design.

- **`README.md`**: The main entry point for the project, containing a high-level overview.
- **`DEVELOPMENT_PLAN.md`**: Outlines the development roadmap, priorities, and milestones.
- **`ARCHITECTURE.md`**: Describes the high-level technical architecture and how modules interact.
- **`UI-wireframe.md`**: Defines the user interface, user experience, and overall application layout.
- **`CHANGELOG.md`**: A log of all notable changes made to the project.

---

## Project Structure Overview
```
qualia-nss/
├── .github/
│   └── workflows/
│       ├── deploy.yml
│       └── test-sftp.yml
├── assets/
│   ├── data/                  # Sample CSVs and frequency curves
│   └── src/
│       └── four_leaf_clover.svg
├── dev/
│   ├── st00-wireframe/
│   │   ├── APP_SHELL_WIREFRAME.md
│   │   └── ARCHITECTURE.md
│   ├── DEPLOYMENT_SETUP.md
│   └── deploy.yml
├── docs/
│   ├── NSS-Setup-Analysis/
│   ├── SPL-samples/
│   ├── chrome-music-lab/
│   └── spectrogram/
├── modules/
│   ├── 7band-level-meter/
│   ├── comb-filtering/
│   ├── spectrogram/
│   └── spectrum-analyzer/
├── src/
│   ├── cabinets/
│   │   ├── index.html
│   │   └── index.js
│   ├── filters/
│   │   ├── index.html
│   │   └── index.js
│   ├── speakers/
│   │   ├── index.html
│   │   └── index.js
│   └── tests/
│       ├── index.html
│       └── index.js
├── .htaccess                  # Security and routing for static hosting
├── app.js                     # App shell, SPA routing, module loader, theme mgmt
├── index.html                 # Main entry with navbar and content wrapper
├── style.css                  # Theming, layout, responsive styles
├── WORKSPACE_INDEX.md         # This index file
├── CLAUDE.md
├── UI-wireframe.md
├── ARCHITECTURE.md
├── DEVELOPMENT_PLAN.md
├── README.md
└── CHANGELOG.md
```

## Core Audio Modules (/modules/)

### 1. Spectrogram (/modules/spectrogram/)
**Purpose**: 3D WebGL spectrogram visualization based on Chrome Music Lab
- `index.html` - Main application page
- `script.js` - Core spectrogram logic
- `style.css` - Styling
- `snd/` - Sample audio files
- **Status**: Needs PRD compliance implementation
- **Priority**: Highest (PRD requirements)

### 2. 7-Band Level Meter (/modules/7band-level-meter/)  
**Purpose**: Real-time 7-band audio level monitoring with calibration
- `index.html` - Main application page
- `script.js` - Level meter logic
- `style.css` - Styling
- `7band-Level-Meter-Report.md` - Technical documentation
- **Status**: Functional, needs UI consistency
- **Priority**: Medium

### 3. Spectrum Analyzer (/modules/spectrum-analyzer/)
**Purpose**: Real-time frequency spectrum analysis
- `index.html` - Main application page  
- `script.js` - Spectrum analysis logic
- `style.css` - Styling
- **Status**: Functional, needs enhancement
- **Priority**: Medium

### 4. Comb-Filtering (/modules/comb-filtering/)
**Purpose**: Acoustic comb filtering detection using cepstrum analysis
- `README.md` - API documentation
- `demo.html` - Interactive demo
- `demo.js` - Demo interface
- `comb-filter.js` - Main detection algorithm
- `*.js` - Supporting audio analysis modules
- **Status**: Library ready, needs integration
- **Priority**: Low

## Documentation (/docs/)

### Project Documentation
- `deployment-workflows.md` - GitHub Actions deployment guide
- `The 7-band Psychoacoustic Foundation of Equalization.md/pdf` - Audio theory
- `dBFS-Explanation.md` - Technical audio measurement docs
- `ChiefArchitectAnalisys_merged.md` - Architecture analysis

### Spectrogram Requirements
- `spectrogram/spectrogram-prd.md` - **Complete PRD for spectrogram enhancement**
- `spectrogram/spectrogram_workflow.md` - Implementation workflow
- `spectrogram/spectrogram_visualization_executive_report.md/pdf` - Analysis report

### Chrome Music Lab Reference
- `chrome-music-lab/` - Complete Chrome Music Lab source code for reference
  - `spectrogram/` - Original spectrogram implementation
  - `soundspinner/` - Audio manipulation reference
  - `pianoroll/` - MIDI visualization reference
  - `arpeggios/`, `chords/`, `melodymaker/` - Additional music tools

### AI Analysis & Planning
- `NSS-Setup-Analysis/` - Multi-AI collaborative analysis
  - `claude-opus-4.1/` - Claude analysis and tools
  - `gemini/` - Gemini implementation plans
  - `chatGPT-5-think/` - ChatGPT technical specs
  - `grok/` - Grok implementation plan

### Sample Data & Testing
- `SPL-samples/` - Audio measurement samples
- `assets/data/` - CSV test files and frequency curves

## App Shell & SPA

### Main Entry Points
- **Landing Page**: `/index.html`
- **App Shell JS**: `/app.js` (SPA routing, dynamic module/sidebars, theme persistence)
- **Global Styles**: `/style.css`

### Module Entry Points (SPA loaded)
- **Speakers**: `/src/speakers/index.html` + `/src/speakers/index.js`
- **Filters**: `/src/filters/index.html` + `/src/filters/index.js`
- **Cabinets**: `/src/cabinets/index.html` + `/src/cabinets/index.js`
- **Tests**: `/src/tests/index.html` + `/src/tests/index.js`

### Configuration & Setup
- `.htaccess` - Directory protection and headers; pretty root URL to `index.html`
- `.github/workflows/*` - Deployment pipelines

## Development Workflow

### Current Phase: Module Reorganization 
- [x] Created modular directory structure
- [x] Moved existing modules to `/modules/`
- [x] Preserved all functionality
- [x] Prepared for UI component extraction

### Next Phase: UI Integration (Gemini)
- [ ] Create main landing page sections/content
- [ ] Implement unified navigation (active state done)
- [ ] Apply consistent theming across modules

### Next Phase: Spectrogram Enhancement (PRD)
- [ ] Implement custom FFT with windowing functions
- [ ] Add 2D/3D visualization modes
- [ ] Interactive tone generation (piano keyboard)
- [ ] Professional measurement tools
- [ ] Export capabilities

### Final Phase: Deployment
- [ ] Static file optimization
- [ ] GitHub Actions deployment
- [ ] Domain `qualia-nss.com` setup
- [ ] Cross-browser testing

## Technology Stack
- **Frontend**: Vanilla HTML/CSS/JavaScript (ES6+), Bootstrap 5 (CSS only) + Bootstrap Icons
- **Audio**: Web Audio API with custom FFT processing
- **3D Graphics**: WebGL 2.0 (with WebGL 1.0 fallback)
- **Deployment**: Static hosting via GitHub Actions
- **Domain**: qualia-nss.com

## Dependencies
- **Minimal external dependencies**: Bootstrap CSS + Icons for UI baseline
- Chrome Music Lab source for reference and techniques
- Web Audio API for all audio processing
- WebGL for 3D spectrogram visualization

---

*This workspace contains a complete audio analysis suite being refactored to a pure frontend architecture for professional deployment.*