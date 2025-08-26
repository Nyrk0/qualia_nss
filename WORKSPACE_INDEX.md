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
├── CLAUDE.md                    # Project instructions for Claude Code
├── REFACTOR_PLAN.md            # Detailed refactor plan
├── WORKSPACE_INDEX.md          # This index file
├── assets/                     # Shared project assets
│   ├── css/                    # CSS files (created by refactor)
│   │   ├── main.css           # Main stylesheet
│   │   └── components.css     # UI components stylesheet
│   ├── js/                     # Shared JavaScript
│   │   ├── core/              # Core functionality
│   │   └── components/        # Reusable components
│   ├── images/                # Images and icons
│   └── data/                  # Sample data files
├── modules/                   # Audio analysis modules (main apps)
├── docs/                      # Documentation and analysis
└── qualia_nss/               # Legacy full-stack app (to be extracted from)
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

## Legacy Assets to Extract (/qualia_nss/)

### UI Components (Priority for Gemini)
- `core/components/navbar/qualia_navbar_comp.js` - Navigation component
- `modules/landing_page/landing_page_comp.js` - Landing page
- `core/styles/aluminum_theme.css` - Premium aluminum theme
- `core/styles/audio_colors.css` - Audio frequency color system

### Utilities
- `core/utils/localStorage.js` - Settings persistence
- `core/utils/theme_manager_svc.js` - Theme management
- `core/utils/spl-file-selector.js` - File handling utilities

### Backend to Remove
- `backend/` - Python Flask backend (deprecated)
- `database/` - MySQL database (deprecated)  
- `docker-compose.yml` - Docker setup (deprecated)
- React components in `src/` - (being replaced with vanilla JS)

## Key Files by Function

### Main Entry Points
- **Landing Page**: To be created at `/index.html`
- **Spectrogram**: `/modules/spectrogram/index.html`
- **Level Meter**: `/modules/7band-level-meter/index.html`
- **Spectrum Analyzer**: `/modules/spectrum-analyzer/index.html`
- **Comb Filter Demo**: `/modules/comb-filtering/demo.html`

### Configuration & Setup
- `CLAUDE.md` - Development instructions
- `docs/deployment-workflows.md` - Deployment setup
- `REFACTOR_PLAN.md` - Implementation roadmap

### Requirements & Specifications  
- `docs/spectrogram/spectrogram-prd.md` - **Complete feature requirements**
- `modules/*/README.md` - Individual module documentation

### Audio Processing Libraries
- `modules/comb-filtering/*.js` - Complete comb filtering detection library
- `docs/chrome-music-lab/` - Reference implementations
- Sample audio files in `modules/spectrogram/snd/`

## Development Workflow

### Current Phase: Module Reorganization ✅
- [x] Created modular directory structure
- [x] Moved existing modules to `/modules/` 
- [x] Preserved all functionality
- [x] Prepared for UI component extraction

### Next Phase: UI Integration (Gemini)
- [ ] Extract UI components from `qualia_nss/`
- [ ] Create main landing page
- [ ] Implement unified navigation
- [ ] Apply consistent theming

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
- **Frontend**: Vanilla HTML/CSS/JavaScript (ES6+)
- **Audio**: Web Audio API with custom FFT processing
- **3D Graphics**: WebGL 2.0 (with WebGL 1.0 fallback)
- **Deployment**: Static hosting via GitHub Actions
- **Domain**: qualia-nss.com

## Dependencies
- **Zero external dependencies** for final modules
- Chrome Music Lab source for reference and techniques
- Web Audio API for all audio processing
- WebGL for 3D spectrogram visualization

---

*This workspace contains a complete audio analysis suite being refactored from full-stack to pure frontend architecture for professional deployment.*