# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Testing Applications
```bash
# Start HTTP server for testing (recommended)
python3 -m http.server 8080
# or
npx http-server -p 8080

# Open in browser: http://localhost:8080/

# For direct file testing (limited functionality)
# Open index.html directly in browser
```

### No Build Process Required
- Pure vanilla JavaScript with ES6 modules
- No package.json, npm scripts, or build tools
- Files can be opened directly or served via any static server
- Changes take effect immediately after browser refresh

## Project Architecture

### Modular Single Page Application (SPA)
**Entry Point**: `index.html` - Unified application shell with modular loading

**Core JavaScript Modules** (`src/js/` - load order critical):
1. `app-core.js` - Theme management and global initialization stubs
2. `ui-utils.js` - UI utilities and scroll-fade effects  
3. `sidebar-manager.js` - Module sidebar HTML templates
4. `module-loader.js` - Dynamic module loading and lifecycle management
5. `navigation.js` - Navigation state and module routing

**Core CSS Modules** (`src/styles/` - dependency chain):
1. `core.css` - CSS variables, theme system (required by all others)
2. `layout.css` - Main content and sidebar layouts
3. `navigation.css` - Header and navbar styling
4. `components.css` - UI components and forms
5. `utilities.css` - Helper classes and scroll effects
6. `responsive.css` - Media queries and mobile adaptations
7. `modules/*.css` - Module-specific styles

### Module Integration Pattern
**Adding New Modules**:
1. Add HTML template to `moduleHTML` object in `module-loader.js:src/js/module-loader.js:9`
2. Add sidebar template to `sidebarHTML` object in `sidebar-manager.js:src/js/sidebar-manager.js:9`
3. Add navigation mapping to `setNavActiveForModule` in `navigation.js:src/js/navigation.js:28`
4. Create module class following pattern: `ModuleName + "Module"` with `init()` and `destroy()` methods
5. Add CSS file to `src/styles/modules/` if needed

### Audio Processing Pipeline
All modules use **Web Audio API** for real-time processing:
- Microphone input via `getUserMedia()` with configurable DSP options
- File/sample playback support for offline analysis  
- Real-time FFT analysis with configurable window sizes
- Professional frequency domain processing and visualization

### Active Modules
- **`src/spectrogram/`** - 3D WebGL spectrogram with Google Chrome Music Lab implementation (✅ **Fully Integrated**)
- **`src/7band-levelmeter/`** - Real-time 7-band psychoacoustic level meter
- **`modules/`** - Legacy standalone modules being migrated to modular architecture

## Critical Development Patterns

### Global Function Exposure Pattern
```javascript
// Required pattern for module functions
window.functionName = () => {
    // Implementation
};
```

### Module Lifecycle Pattern
```javascript
class ModuleNameModule {
    init() {
        // Module initialization
    }
    
    destroy() {
        // Cleanup when switching modules
    }
}
window.ModuleNameModule = ModuleNameModule; // Global exposure required
```

### File Loading Dependencies
**CRITICAL**: Files must load in exact order due to dependencies:
- JavaScript: app-core.js → ui-utils.js → sidebar-manager.js → module-loader.js → navigation.js
- CSS: core.css first (defines variables), then others can load in any order

## Key Implementation Details

### Module Loading System
- Module templates stored in `moduleHTML` and `sidebarHTML` objects
- Dynamic script injection with special case handling (`spectrogram.js` vs standard `index.js`)
- Module state tracking with `window.currentModule`
- Navigation state synchronization via `setNavActiveForModule()`

### Theme System
- CSS custom properties in `core.css:src/styles/core.css` define theme variables
- Light/dark theme toggle via body class `light-theme`
- Theme persistence through localStorage
- All modules inherit theme variables automatically

## Project Structure Overview

### Modular Architecture (`src/`)
```
src/js/          # Core JavaScript modules (load order critical)
src/styles/      # CSS modules (core.css first, others flexible)
src/spectrogram/ # Fully integrated WebGL 3D spectrogram module
src/7band-levelmeter/ # 7-band psychoacoustic level meter
```

### Legacy Structure (`modules/` - migration target)
```
modules/7band-level-meter/    # Standalone 7-band meter
modules/spectrum-analyzer/    # Frequency analysis tool  
modules/comb-filtering/       # Comb filter detection library
modules/spectrogram/          # Legacy spectrogram versions
```

### Development Resources
```
dev/dev_directives/modular_architecture_guide.md  # Complete architecture documentation
docs/deployment-workflows.md                      # Deployment options
assets/data/                                       # Sample audio files and SPL data
```

## Deployment & Production

### Static Hosting Ready
- No build process or server-side requirements
- CDN-optimized with proper CORS headers
- GitHub Actions deployment workflows available in `dev/`
- Domain configured for `qualia-nss.com`

### Browser Requirements  
- Modern browsers with Web Audio API support
- WebGL required for 3D spectrogram (automatic fallback available)
- ES6+ support for module system

## Key Files to Understand

### Architecture Entry Points
- `index.html` - Application shell and module loading setup
- `src/js/module-loader.js` - Central module orchestration logic
- `src/js/sidebar-manager.js` - Module sidebar templates
- `dev/dev_directives/modular_architecture_guide.md` - Complete architecture documentation

### Specialized Modules
- `src/spectrogram/spectrogram.js` - WebGL 3D implementation with Google Chrome Music Lab code
- `modules/comb-filtering/` - Professional comb filter detection ES6 library
- `src/styles/core.css` - Theme system and CSS variables foundation

## Colormap Architecture

**CRITICAL**: Maintain strict separation between module colormaps and component colormaps.

### Module Colormaps
- **Purpose**: Control visualization appearance (spectrogram, charts, graphs)
- **Examples**: Chrome Music Lab, Inferno, Viridis, Turbo
- **Control**: User-selectable via module UI
- **Scope**: Module-specific implementations

### Component Colormaps  
- **Purpose**: Control UI component colors (tone-control, sliders, buttons)
- **Examples**: Qualia 7band (default), Google Turbo
- **Control**: Built into component (`toneControl.colormap = 'qualia7band'`)
- **Scope**: Global across all modules

### Independence Rule
> **Never mix module and component colormap systems.** Module visualization colors ≠ component UI colors.

**See**: `dev/dev_directives/colormap_architecture.md` for complete guidelines.