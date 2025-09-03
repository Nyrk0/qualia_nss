# Qualia-NSS Modularization Strategy (st01) - COMPLETED

This document defines the conventions and steps for migrating standalone tools under `modules/` into first-class modules under the app shell `src/` with a consistent lifecycle and shared dependencies.

## ✅ COMPLETION STATUS

**Stage 01 Modularization is now COMPLETE**. This strategy has been successfully implemented with the following major accomplishments:

### Core Architecture Refactoring ✅
- **JavaScript Modularization**: Refactored monolithic `app.js` (600+ lines) into 5 modular files under `src/js/`
- **CSS Modularization**: Refactored monolithic `style.css` (800+ lines) into 8 modular files under `src/styles/`
- **Module Loading System**: Implemented dynamic module loading with lifecycle management
- **Sidebar Management**: Advanced Bootstrap accordion-based sidebar with scroll-fade effects

### Spectrogram Module Integration ✅
- **Full Refactoring**: Successfully converted standalone spectrogram module to modular architecture
- **Advanced Sidebar**: Implemented sophisticated accordion controls matching wireframe design
- **WebGL 3D Preserved**: Maintained all original 3D visualization and audio processing capabilities
- **Module Loader Integration**: Proper initialization function calling and lifecycle management

### Documentation & Guides ✅
- **Comprehensive Architecture Guide**: Merged JS/CSS guides into unified modular architecture documentation
- **Safe Development Workflows**: Established backup and incremental development practices
- **Loading Order Dependencies**: Documented all inter-module dependencies and loading sequences
- **Staged Development Methodology**: Created general methodology guide (see `../dev_directives/staged_development_methodology.md`)

## Goals
- Unify module lifecycle with `init()` and `destroy()` methods.
- Use fragment-only HTML injected into `#main-content` via `app.js`.
- Centralize shared deps (Chart.js, UploadService) in root `index.html` and `lib/`.
- Isolate CSS under a module namespace to avoid collisions.
- Keep event listeners scoped and cleaned up on destroy.

## File Structure
- `src/<module-name>/index.html` — Fragment HTML only (no head/body).
- `src/<module-name>/index.js` — Exposes `window.<PascalCase>Module` class with `init/destroy`.
- `src/<module-name>/styles.css` — Scoped stylesheet for the module.
- `lib/` — Shared utilities (e.g., `upload-service.js`).

Example for SPL:
- `src/speakers-spl/index.html`
- `src/speakers-spl/index.js` → `window.SpeakersSplModule`
- `src/speakers-spl/styles.css`

## App Shell Wiring
- `index.html`:
  - Include global deps:
    - `chart.umd.js`
    - `lib/upload-service.js`
- `app.js`:
  - `moduleHTML['speakers-spl']` contains `<div id="speakers-spl-root" class="spl-viewer"></div>`.
  - `sidebarHTML['speakers-spl']` defines sidebar for the module.
  - `loadModule(name)` resolves kebab-case to `PascalCaseModule` and instantiates.
  - Redirect legacy names (e.g., `'speakers'` → `'speakers-spl'`).

## Module API
```js
class ModuleNameModule {
  async init() { /* inject fragment, ensure styles, wire events, init charts */ }
  destroy() { /* remove events, destroy charts, clear DOM */ }
}
```
- No globals other than the class export on `window`.
- All DOM queries must be inside the module root container.

## CSS Conventions
- Prefix all selectors with a stable namespace, e.g., `.spl-viewer`.
- Avoid global resets; rely on Bootstrap variables where possible.

## Theming and Minimal Scrollbars
- Use app-level CSS variables defined in `style.css` (not Bootstrap vars) for consistent dark/light themes:
  - `--bg-color`, `--text-color`, `--panel-bg-color`, `--panel-border-color`, `--accent-color`, `--accent-hover-color`.
- Module containers and cards must use panel surfaces and borders:

```css
.module-root .panel,
.module-root .chart-container {
  background: var(--panel-bg-color);
  border: 1px solid var(--panel-border-color);
  border-radius: 8px;
}
```

- Sidebar surface should match panels:

```css
#sidebar { background: var(--panel-bg-color); }
#sidebar .metric-group {
  background: var(--panel-bg-color);
  border: 1px solid var(--panel-border-color);
  border-radius: .375rem;
}
```

- Minimal scrollbars: hidden by default, visible (thin) on hover only. Reuse this class for any scrollable region:

```css
.scroll-minimal {
  overflow: auto;
  scrollbar-width: none;        /* Firefox */
  -ms-overflow-style: none;     /* IE/Edge */
}
.scroll-minimal::-webkit-scrollbar { width: 0; height: 0; } /* WebKit */
.scroll-minimal:hover { scrollbar-width: thin; }
.scroll-minimal:hover::-webkit-scrollbar { width: 8px; height: 8px; }
.scroll-minimal:hover::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 8px; }
.scroll-minimal:hover::-webkit-scrollbar-track { background: transparent; }
```

- Apply to `#sidebar`, analysis content (e.g., `#spl-analysis-content`), and long lists in modules.

- JS components (e.g., Chart.js) should read computed CSS variables and reapply on theme toggle:

```js
function readThemeVars() {
  const cs = getComputedStyle(document.body);
  return {
    text: cs.getPropertyValue('--text-color').trim(),
    grid: cs.getPropertyValue('--panel-border-color').trim(),
    bg: cs.getPropertyValue('--panel-bg-color').trim(),
  };
}
// Re-read on theme toggle or class change and update visuals accordingly
```

## Data Loading & Parsing
- Use `FileReader` for CSV.
- Parse as `[frequency, spl]` numeric pairs; ignore bad rows.
- Provide minimal analysis (A-weighted SPL, resonances, crest factor) for UX feedback.

## Charting
- Use Chart.js globally (provided by shell).
- Logarithmic x-axis (20 Hz – 20 kHz), y-axis in dB SPL.
- Distinguish curves with colors; use dashed style for computed sums.

## Upload Service
- `lib/upload-service.js` is a shared utility.
- In dev, treat missing backend as stub-success.

## Local Development and CORS
- When opening the app via the `file://` protocol, browsers block `fetch()` to local files, causing CORS errors for fragment loads (origin `null`).
- Modules should gracefully handle this by inlining their fragment HTML when `fetch()` is blocked or when running under `file://`.

Recommended pattern inside `src/<module>/index.js`:
```js
async init() {
  this.root = document.getElementById('<module>-root');
  const isFile = typeof location !== 'undefined' && location.protocol === 'file:';
  if (isFile) {
    this.root.innerHTML = this._inlineFragment();
  } else {
    try {
      const html = await fetch('src/<module>/index.html').then(r=>r.text());
      this.root.innerHTML = html;
    } catch (e) {
      this.root.innerHTML = this._inlineFragment(); // CORS-safe fallback
    }
  }
  // continue: ensure styles, init chart, wire events...
}
```

- For production-like testing, serve over HTTP to avoid `file://` CORS quirks:
  - Python: `python3 -m http.server 8080`
  - Node: `npx http-server -p 8080`

## Migration Workflow
1. Build feature standalone under `modules/` (optional).
2. Extract HTML to `src/<module>/index.html` (fragment only).
3. Implement `index.js` module class with lifecycle.
4. Add styles in `styles.css` under namespace.
5. Wire `app.js` with `moduleHTML`/`sidebarHTML` and loader.
6. Redirect legacy names and remove old iframe loaders.
7. After verification, delete old `src/<legacy>` directory.

## ✅ IMPLEMENTATION HIGHLIGHTS

### Modular JavaScript Architecture (`src/js/`)
- **app-core.js**: Core initialization, theme management, global stubs (~40 lines)
- **ui-utils.js**: Scroll fade effects, UI utilities (~50 lines)
- **sidebar-manager.js**: Advanced accordion sidebar templates (~150 lines)
- **module-loader.js**: Dynamic module loading, lifecycle management (~200 lines)
- **navigation.js**: Navigation state, routing, active states (~120 lines)

### Modular CSS Architecture (`src/styles/`)
- **core.css**: CSS variables, fonts, typography (~70 lines)
- **layout.css**: Main content, sidebar, grid layouts (~120 lines)
- **navigation.css**: Header, navbar, theme toggle (~180 lines)
- **components.css**: Buttons, forms, interactive elements (~200 lines)
- **utilities.css**: Scroll effects, helper classes (~50 lines)
- **responsive.css**: Media queries, mobile adaptations (~60 lines)
- **modules/**: Module-specific styles with proper namespacing

### Spectrogram Module Refactoring
- **HTML Fragment**: Converted standalone HTML to modular fragment format
- **Modular JavaScript**: Replaced DOMContentLoaded with `initializeSpectrogram()` function
- **Sidebar Integration**: Advanced Bootstrap accordion with all original controls
- **WebGL Preservation**: Maintained complete 3D visualization functionality
- **Audio Processing**: Preserved all microphone input, DSP options, and analysis features

### Advanced Sidebar Features
- **Bootstrap Accordion**: Organized controls into collapsible sections
- **Scroll Fade Effects**: Visual fade gradients on scrollable content
- **Responsive Design**: Mobile-optimized control layouts
- **Theme Integration**: Consistent theming across all sidebar elements

## Testing Checklist ✅
- ✅ Load module via navbar; no console errors
- ✅ Spectrogram module loads with full 3D WebGL functionality
- ✅ Advanced sidebar controls work (rotation, position, audio source)
- ✅ Theme toggles: all modules maintain consistent styling
- ✅ Scroll fade effects function properly in sidebar content
- ✅ Module lifecycle: proper initialization and cleanup
- ✅ Responsive design: mobile/tablet layouts work correctly
- ✅ Loading order dependencies: all scripts load in correct sequence

## Notes
- Prefer small, well-scoped modules; avoid cross-module coupling.
- Keep dependencies lean and shared via shell where possible.
