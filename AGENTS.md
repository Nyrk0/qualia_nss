# AGENTS.md - Universal AI Assistant Instructions

**Project**: Qualia-NSS - Web-based Audio Analysis Toolkit  
**Version**: 2.1  
**Compatible**: Claude, Gemini, GPT, and other AI assistants  
**Last Updated**: 2025-09-01

---

## 🎯 Project Overview

Qualia-NSS is a professional web-based audio analysis toolkit for audio engineering applications. It functions as a **modular single-page application (SPA)** built with vanilla JavaScript, avoiding frameworks for maximum compatibility and performance.

### Core Technologies
- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **UI Framework**: Bootstrap 5 (CSS-only) with custom themeable system
- **Audio Processing**: Web Audio API for real-time analysis
- **Graphics**: WebGL (3D spectrogram), Chart.js (2D plotting)
- **Architecture**: Modular SPA with dynamic module loading

### Key Features
- 3D WebGL Spectrogram with Google Chrome Music Lab implementation
- Real-time 7-band psychoacoustic level meter
- Professional frequency domain processing
- Progressive Web App (PWA) with mobile optimization

---

## 🔧 Development Commands

### Starting the Application
```bash
# Recommended: HTTP server (required for ES6 modules)
python3 -m http.server 8080
# or
npx http-server -p 8080

# Access: http://localhost:8080/
```

### No Build Process Required
- Pure vanilla JavaScript with ES6 modules
- No package.json, npm scripts, or build tools required
- Changes take effect immediately after browser refresh
- Direct file opening has limited functionality due to CORS

---

## 🏗️ Architecture Overview

### Modular SPA Architecture
- **Entry Point**: `index.html` - Unified shell with dynamic module loading
- **Pattern**: Vanilla JavaScript ES6 modules with global compatibility
- **Loading**: Sequential JavaScript, CSS with dependency management

<details>
<summary><strong>📜 Core File Load Order (Click to expand)</strong></summary>

**JavaScript Load Order** (CRITICAL - must load in sequence):
1. `src/js/app-core.js` - Theme management and global stubs
2. `src/js/ui-utils.js` - UI utilities and scroll effects  
3. `src/js/sidebar-manager.js` - Module sidebar templates
4. `src/js/module-loader.js` - Dynamic module loading
5. `src/js/navigation.js` - Navigation state and routing

**CSS Load Order** (core.css first, others flexible):
1. `src/styles/core.css` - CSS variables and theme system ⚡ REQUIRED FIRST
2. `src/styles/layout.css` - Main content and sidebar layouts
3. `src/styles/navigation.css` - Header and navbar styling
4. `src/styles/components.css` - UI components and forms
5. `src/styles/utilities.css` - Helper classes
6. `src/styles/responsive.css` - Mobile and PWA optimizations
7. `src/styles/modules/*.css` - Module-specific styles

</details>

<details>
<summary><strong>🔧 Module Integration Checklist (Click to expand)</strong></summary>

**Adding New Modules Requires**:
1. HTML template → `moduleHTML` object (`module-loader.js:9`)
2. Sidebar template → `sidebarHTML` object (`sidebar-manager.js:9`) 
3. Navigation mapping → `setNavActiveForModule` (`navigation.js:28`)
4. Module class → `ModuleName + "Module"` with `init()` and `destroy()` methods
5. Global exposure → `window.ModuleNameModule = ModuleNameModule`

</details>

---

## 🎨 UI/UX Standards (MANDATORY)

### Core Principle: Theme First
**ALL STYLING MUST USE CSS VARIABLES FROM `src/styles/core.css`**

#### ✅ CORRECT Usage
```css
.component {
    background-color: var(--panel-bg-color);
    color: var(--text-color);
    padding: var(--spacing-md);
    border-radius: var(--spacing-xs);
}
```

#### ❌ FORBIDDEN Usage
```css
.component {
    background-color: #1e1e1e;  /* HARDCODED - FORBIDDEN */
    color: #e0e0e0;            /* HARDCODED - FORBIDDEN */
    padding: 16px;             /* HARDCODED - FORBIDDEN */
}
```

### HTML Standards (MANDATORY)
```html
<!-- ✅ CORRECT: Semantic hierarchy -->
<h1>Module Name</h1>
<h2>Major Section</h2>
<h3>Subsection</h3>

<!-- ✅ CORRECT: Bootstrap accordion pattern -->
<div class="accordion" id="sidebarAccordion">
    <div class="accordion-item">
        <h2 class="accordion-header" id="heading-section">
            <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-section">
                Section Title
            </button>
        </h2>
        <div id="collapse-section" class="accordion-collapse collapse show">
            <div class="accordion-body">Content here</div>
        </div>
    </div>
</div>

<!-- ❌ FORBIDDEN: Inline styles -->
<div style="padding: 10px; background: #333;">Content</div>
```

### JavaScript Standards (MANDATORY)
```javascript
// ✅ CORRECT: Class-based state management
element.classList.add('is-active');
element.classList.remove('is-disabled');

// ❌ FORBIDDEN: Direct style manipulation
element.style.color = 'red';
element.style.display = 'none';
```

---

## 📁 Project Structure

<details>
<summary><strong>🎵 Active Modules (Click to expand)</strong></summary>

```
src/spectrogram/          # 3D WebGL spectrogram (✅ Integrated)
src/7band-levelmeter/     # Psychoacoustic level meter  
src/wiki/                 # Documentation system (Git submodule)
```

</details>

<details>
<summary><strong>⚙️ Core System (Click to expand)</strong></summary>

```
src/js/                   # Core JavaScript (load order critical)
src/styles/               # CSS modules (core.css first)
src/components/           # Reusable web components
```

</details>

<details>
<summary><strong>📚 Development Resources (Click to expand)</strong></summary>

```
dev/core/                 # Primary development rules
dev/specialized/          # Domain-specific guidelines  
docs/                     # Documentation and guides
assets/data/              # Sample audio files and test data
```

</details>

---

## ⚡ Development Patterns

### Module Lifecycle Pattern
```javascript
class NewModuleModule {
    constructor() {
        // Initialize state
    }
    
    async init() {
        // Setup UI, events, load data
        console.log('✓ NewModule initialized');
    }
    
    destroy() {
        // Cleanup resources
        console.log('🗑️ NewModule destroyed');
    }
}

// Global exposure REQUIRED
window.NewModuleModule = NewModuleModule;
```

### Global Function Exposure (REQUIRED)
```javascript
// All module functions must be globally accessible
window.functionName = () => {
    // Implementation
};
```

### Component Development (Web Components)
```javascript
// Hybrid ES6 export pattern
export { ComponentName };

// Global fallback for compatibility
if (typeof window !== 'undefined') {
    window.ComponentName = ComponentName;
}
```

---

## 📱 Mobile PWA Features

### Progressive Web App Configuration
- `manifest.json` with `"display": "fullscreen"`
- iOS Safari optimization with safe area handling
- Dynamic viewport height (`100dvh`) for mobile browsers
- Touch target optimization (44px minimum)
- Momentum scrolling for iOS (`-webkit-overflow-scrolling: touch`)

### Mobile-Specific CSS Requirements
```css
@media (max-width: 768px) {
    /* Touch targets minimum 44px */
    button, .btn {
        min-height: 44px;
        touch-action: manipulation;
    }
    
    /* Safe area handling for notch */
    body {
        padding-top: env(safe-area-inset-top);
        padding-bottom: env(safe-area-inset-bottom);
    }
}
```

---

## 🧪 Testing Requirements

### Browser Compatibility Testing
- ✅ Chrome (primary development browser)
- ✅ Firefox (Web Audio API compatibility)
- ✅ Safari (WebKit compatibility)
- ✅ Edge (Chromium compatibility)

### Mobile PWA Testing (Critical for iOS Chrome)
- ✅ iOS Safari: Add to Home Screen functionality
- ✅ iOS Chrome: Full-screen behavior without browser chrome
- ✅ Android Chrome: PWA install and full-screen mode
- ✅ Touch targets: All interactive elements ≥44px minimum
- ✅ Safe areas: Proper notch/camera cutout handling

### Built-in Test Suites
```bash
# ES6 Infrastructure Test
http://localhost:8080/src/core/es6-test.html

# Component System Test  
http://localhost:8080/src/core/phase2-test.html

# Wiki Module Test
http://localhost:8080/src/wiki/test-wiki.html
```

---

## 🔒 Critical Development Rules

### **MANDATORY USER APPROVAL BEFORE COMMITS** ⚠️

**CRITICAL REQUIREMENT**: ALL AI assistants MUST obtain explicit user approval before ANY git commit or push operations.

#### Required Approval Process:
1. **Present Summary**: List all changed files and explain modifications
2. **Ask Explicitly**: "May I commit and push these changes?"  
3. **Wait for Confirmation**: Only proceed with clear "yes", "approve", "commit", or "push"
4. **Handle Rejection**: If user says "no", address concerns before proceeding

#### Never Commit Without Approval:
- ❌ Do not auto-commit fixes, even critical ones
- ❌ Do not push changes during "emergency" situations without asking
- ❌ Do not assume user wants changes committed
- ✅ Always present changes and wait for explicit approval

### MANDATORY Compliance Checklist
- [ ] **No Hardcoded Values**: All CSS must use theme variables
- [ ] **No Inline Styles**: Zero `style=""` attributes in HTML
- [ ] **Semantic Hierarchy**: Proper H1→H2→H3 structure
- [ ] **Bootstrap Accordion**: Standard pattern for all sidebars
- [ ] **Global Exposure**: All module functions accessible via `window`
- [ ] **Module Lifecycle**: Proper `init()` and `destroy()` methods

### Quality Assurance
- [ ] **Theme Variables**: Search codebase for hardcoded colors/spacing
- [ ] **Cross-browser**: Test in Chrome, Firefox, Safari, Edge
- [ ] **Mobile PWA**: Test full-screen behavior on iOS Chrome
- [ ] **Touch Targets**: Verify 44px minimum for mobile elements
- [ ] **ES6 Modules**: Ensure proper loading order and dependencies

---

## 📝 Documentation Requirements

### Code Documentation (JSDoc)
```javascript
/**
 * @fileoverview Module description
 * @author Qualia-NSS Development Team
 * @version 1.0.0
 */

/**
 * Class description
 * @class
 */
class ModuleClass {
    /**
     * Method description
     * @param {string} param - Parameter description
     * @returns {Promise<void>} Promise resolving when complete
     */
    async methodName(param) {
        // Implementation
    }
}
```

### CSS Documentation
```css
/**
 * Component Name - Brief description
 * Part of the Qualia-NSS modular CSS architecture
 * COMPLIANT with UI/UX Development Directive v1.0
 * @author Qualia-NSS Development Team
 * @version 1.0.0
 */
```

---

## 🚨 Critical Restrictions

### Security & Safety
- **No Malicious Code**: Never create, modify, or improve code for malicious purposes
- **Defensive Security Only**: Allow security analysis, detection rules, vulnerability explanations
- **No Secrets**: Never expose or log API keys, tokens, or sensitive data

### Development Constraints  
- **No Framework Dependencies**: Maintain vanilla JavaScript architecture
- **No Build Tools**: Keep zero-build approach for maximum compatibility
- **Library Verification**: Always verify if libraries are already used before adding new ones

---

## 🎯 Current Development Focus

### Active Initiatives
1. **ES6 Modules Migration**: Phase 1 & 2 infrastructure complete
2. **UI/UX Standardization**: Bootstrap accordion pattern across all modules
3. **Mobile PWA Optimization**: Full-screen iOS Chrome experience
4. **Wiki System Integration**: Git submodule with live documentation
5. **Comb-Filtering Tool (ST04)**: **PHASE 2B COMPLETE** - Perfect Logic Framework implemented with educational visualization state machine

### Specialized Features
- **Colormap Architecture**: Strict separation between module and component colormaps
- **Audio Processing**: Professional Web Audio API implementation
- **3D Visualization**: WebGL spectrogram with Google Chrome Music Lab code
- **Comb-Filtering Educational Framework**: Multi-speaker delay simulation with Perfect Logic Framework implementation
  - **Reference Signal Display Mode**: Shows raw reference signals when no speakers active (`analyzers.reference`)
  - **Simulation Output Display Mode**: Shows mixed delayed signals when speakers active (`analyzers.input`)
  - **CRITICAL: Reference Signal Embedding**: Reference signals flow THROUGH speaker processing (not isolated)
    - Same reference signal splits to ALL 4 speaker delay chains simultaneously
    - Multiple delayed copies mix at `speakerBus.output` → feeds analysis/visualization
    - Students see BEFORE (raw) vs AFTER (processed) of the same audio source
  - **Read-only Parameter System**: Delays computed from listener position (general case)
  - **Framework Compliance Verification**: Automatic validation during critical operations
  - **Computational Analysis Framework** (Phase 3 Roadmap):
    - **Dual-Path Analysis**: Unprecedented access to both dry (`analyzers.reference`) and wet (`analyzers.input`) signals
    - **Real-time Comb Quantification**: Automatic notch detection, delay verification, theoretical vs measured comparisons
    - **Phase Relationship Analysis**: Constructive/destructive interference measurement, coherence calculation
    - **Impulse Response & Transients**: Attack velocity analysis, temporal smearing, transient preservation measurement
    - **Educational Analytics**: Quantitative learning assessment, adaptive feedback, progress tracking
    - **Research Capabilities**: Room acoustics validation, psychoacoustic analysis, professional-level accuracy
  - **Future Phase 3**: Centered listener mode with active parameter control
  - **Future Phase 4**: Real-world audio input analysis layer
    - **Multi-Input Support**: Internal mic, external mic, audio line-in, USB audio interfaces (raw/calibrated)
    - **Triple-Path Analysis**: Digital reference + simulation + real acoustic measurement
    - **Professional Calibration**: Frequency response correction, sensitivity adjustment, noise characterization
    - **Acoustic Validation**: Compare digital simulations with real-world measurements
    - **Advanced Experiments**: Room characterization, multi-position analysis, theory vs reality validation
    - **Research Platform**: Complete acoustic measurement and education platform

---

## 📞 Getting Help

- **Issues**: Report problems at `https://github.com/anthropics/claude-code/issues` (for Claude Code)
- **Commands**: Use `/help` for Claude Code assistance
- **Documentation**: Check `dev/dev_directives/` for detailed guidelines
- **Architecture**: See `dev/dev_directives/modular_architecture_guide.md`

---

**This file serves as the single source of truth for all AI assistants working with Qualia-NSS. Follow these guidelines exactly to maintain architectural coherence and quality standards.**

*Universal Instructions v2.0 | Compatible with Claude, Gemini, GPT, and other AI assistants*