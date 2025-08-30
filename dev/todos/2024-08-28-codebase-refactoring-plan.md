# Codebase Refactoring Plan

**Date:** 2024-08-28  
**Status:** Proposed  
**Requester:** System Analysis  
**Scope:** Production code in `/src` and `/lib` directories only

## Backup Strategy
Before making any changes, we'll create timestamped backups:
```bash
# Create backup with timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
cp -r /src /src_bckup_${TIMESTAMP}
cp -r /lib /lib_bckup_${TIMESTAMP}
cp /index.html /index.html_bckup_${TIMESTAMP}
```

## Files to Refactor

### Core Application Files
1. `/index.html` - Main entry point
2. `/src/js/app.js` - Main application logic
3. `/src/js/module-loader.js` - Module management
4. `/src/js/router-manager.js` - Routing logic
5. `/src/js/sidebar-manager.js` - Sidebar functionality
6. `/src/js/ui-utils.js` - UI utilities
7. `/src/js/navigation.js` - Navigation logic

### Modules
1. `/src/7band-levelmeter/` - Audio level meter
2. `/src/cabinets/` - Cabinet simulation
3. `/src/filters/` - Audio filters
4. `/src/speakers-spl/` - Speaker SPL viewer
5. `/src/spectrogram/` - Audio spectrogram

### Components
1. `/lib/components/tone-control/` - Tone control component
2. `/lib/upload-service.js` - File upload service

### Styles
1. `/src/styles/` - All CSS files

## Refactoring Examples

### 1. Module Loader Refactoring
**File:** `/src/js/module-loader.js`

**Current:**
```javascript
// Inconsistent module pattern
var ModuleLoader = (function() {
    function loadModule(moduleName) {
        // Implementation
    }
    return {
        load: loadModule
    };
})();
```

**Proposed:**
```javascript
// ES Module pattern
export class ModuleLoader {
    static async load(moduleName) {
        try {
            const module = await import(`/src/${moduleName}/index.js`);
            return module;
        } catch (error) {
            console.error(`Failed to load module: ${moduleName}`, error);
            throw error;
        }
    }
}
```

### 2. Web Component Refactoring
**File:** `/lib/components/tone-control/tone-control.js`

**Current:**
```javascript
const TEMPLATE = document.createElement('template');
TEMPLATE.innerHTML = `
    <style>
        /* Inline styles */
    </style>
    <div class="container">...</div>
`;
```

**Proposed:**
```javascript
// External styles
import styles from './tone-control.css' assert { type: 'css' };

export class ToneControl extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.adoptedStyleSheets = [styles];
    }
}
```

### 3. CSS Organization
**File:** `/src/styles/components.css`

**Current:**
```css
/* Inconsistent naming */
.control-panel {}
.audioControl {}
#volumeSlider {}
```

**Proposed:**
```css
/* BEM naming convention */
.control-panel {}
.control-panel__slider {}
.control-panel__slider--active {}
.audio-control {}
.audio-control__volume {}
```

## Objective  
Refactor the production codebase to improve maintainability, consistency, and performance, focusing exclusively on the application code in `/src` and `/lib` directories.

## Analysis Summary  
### JavaScript Files  
- Multiple module patterns in use (ES modules, IIFEs, global scripts)  
- Inconsistent error handling  
- Duplicate functionality across components  
- Mixing of concerns in some files

### HTML Files  
- Inconsistent structure across components  
- Inline styles mixed with external CSS  
- Hardcoded content that could be templated  
- Varying levels of semantic HTML usage  

### CSS Files  
- Inconsistent naming conventions  
- Mixed CSS methodologies (BEM, SMACSS, etc.)  
- Overly specific selectors  
- Potential unused styles  

## Refactoring Tasks  

### 1. JavaScript Refactoring (Priority: High)  
- [ ] Standardize on ES modules for all JavaScript files  
- [ ] Implement consistent error handling patterns  
- [ ] Extract duplicate code into shared utilities in `/lib`  
- [ ] Enforce code style with ESLint  
- [ ] Add JSDoc comments for all public APIs  
- [ ] Implement proper component lifecycle management  

### 2. Web Components (Priority: High)  
- [ ] Ensure consistent component structure in `/lib/components`  
- [ ] Standardize event handling and property binding  
- [ ] Implement proper shadow DOM encapsulation  
- [ ] Add comprehensive component documentation  

### 3. HTML Structure (Priority: Medium)  
- [ ] Move inline styles to external CSS  
- [ ] Ensure semantic HTML5 structure  
- [ ] Add ARIA attributes for accessibility  
- [ ] Implement consistent layout patterns  

### 4. CSS Organization (Priority: Medium)  
- [ ] Adopt BEM naming convention for all components  
- [ ] Organize CSS into logical modules  
- [ ] Remove unused styles  
- [ ] Implement CSS custom properties for theming  

## Dependencies  
- Node.js for build tools  
- ESLint for JavaScript linting  
- Stylelint for CSS linting  
- Web Component polyfills (if needed)  

## Risks  
- Breaking changes during refactoring  
- Need for thorough testing after changes  
- Potential performance impact during transition  

## Progress Log  
- [2024-08-28] Initial analysis and plan created  
- [2024-08-28] Scope updated to focus on /src and /lib directories only
