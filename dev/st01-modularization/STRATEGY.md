# Qualia-NSS Modularization Strategy (st01)

This document defines the conventions and steps for migrating standalone tools under `modules/` into first-class modules under the app shell `src/` with a consistent lifecycle and shared dependencies.

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

## Testing Checklist
- Load module via navbar; no console errors.
- Load sample CSVs under `assets/data/`; curves render.
- Sum operation works with ≥2 curves.
- Clear resets state; destroy removes listeners.
- Upload shows stub success.
- Theme toggles: styles remain legible.

## Notes
- Prefer small, well-scoped modules; avoid cross-module coupling.
- Keep dependencies lean and shared via shell where possible.
